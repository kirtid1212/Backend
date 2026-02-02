const Order = require('../models/Order');
const payuService = require('../services/payu.service');
const { exponentialBackoff } = require('../middleware/payu.middleware');

exports.initiatePayment = async (req, res) => {
  try {
    const { amount: rawAmount, productinfo, firstname, email, phone, orderId, udf1, udf2, udf3, udf4, udf5, userCredential } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!rawAmount || !productinfo || !firstname || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const { PAYU_KEY: key, PAYU_SALT: salt, BASE_URL: baseUrl = 'http://localhost:3000', PAYU_ENVIRONMENT: environment = '1' } = process.env;
    
    if (!key || !salt) {
      return res.status(500).json({ success: false, message: 'Payment service misconfigured' });
    }

    const txnid = orderId || `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    const existingOrder = await Order.findOne({ order_number: txnid });
    if (existingOrder?.payment_status === 'paid') {
      return res.status(409).json({ success: false, message: 'Transaction already completed' });
    }

    if (!payuService.isServiceAvailable()) {
      return res.status(503).json({ success: false, message: 'Service temporarily unavailable', retryAfter: 60 });
    }

    let hash;
    try {
      hash = await payuService.generateHash({ key, txnid, amount: amount.toFixed(2), productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5 });
    } catch (error) {
      const isRateLimit = error.message?.includes('Too many Requests');
      return res.status(isRateLimit ? 429 : 500).json({
        success: false,
        message: isRateLimit ? 'Too many requests. Retry in 60s' : 'Payment initialization failed',
        ...(isRateLimit && { retryAfter: 60 })
      });
    }

    global.paymentSessions = global.paymentSessions || {};
    global.paymentSessions[txnid] = { userId, email, amount, productinfo, firstname, udf1, udf2, udf3, udf4, udf5, createdAt: Date.now() };

    res.json({
      success: true,
      data: {
        key,
        txnid,
        amount: amount.toFixed(2),
        productinfo,
        firstname,
        email,
        phone,
        hash,
        ios_surl: `${baseUrl}/api/v1/payment/success`,
        ios_furl: `${baseUrl}/api/v1/payment/failure`,
        android_surl: `${baseUrl}/api/v1/payment/success`,
        android_furl: `${baseUrl}/api/v1/payment/failure`,
        environment,
        userCredential: userCredential || `${key}:${userId}`,
        udf1: udf1 || '',
        udf2: udf2 || '',
        udf3: udf3 || '',
        udf4: udf4 || '',
        udf5: udf5 || ''
      }
    });

  } catch (error) {
    const isRateLimit = error.message?.includes('Too many Requests');
    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      message: isRateLimit ? 'Too many requests. Retry in 60s' : 'Payment initiation failed',
      ...(isRateLimit && { retryAfter: 60 })
    });
  }
};

exports.paymentSuccess = async (req, res) => {
  try {
    const { txnid, amount, productinfo, firstname, email, status, hash, key, udf1, udf2, udf3, udf4, udf5, mihpayid, mode, bank_ref_num, cardnum } = req.body;

    if (!txnid || !hash) {
      return res.status(400).json({ success: false, message: 'Invalid callback data' });
    }

    let isValidHash;
    try {
      isValidHash = await payuService.verifyHash({ key, txnid, amount, productinfo, firstname, email, status, receivedHash: hash, udf1, udf2, udf3, udf4, udf5 });
    } catch (error) {
      const isRateLimit = error.message?.includes('Too many Requests');
      return res.status(isRateLimit ? 429 : 500).json({
        success: false,
        message: isRateLimit ? 'Verification delayed. Contact support if charged' : 'Verification failed'
      });
    }

    if (!isValidHash) {
      return res.status(403).json({ success: false, message: 'Invalid payment signature' });
    }

    if (status !== 'success') {
      return res.status(400).json({ success: false, message: 'Payment not successful', data: { txnid, status } });
    }

    const existingOrder = await Order.findOne({ order_number: txnid });
    if (existingOrder?.payment_status === 'paid') {
      return res.json({ success: true, message: 'Payment already processed', data: { txnid, mihpayid: existingOrder.payment_details?.mihpayid, amount, status: 'already_processed' } });
    }

    const paymentSession = global.paymentSessions?.[txnid];
    const updateData = {
      payment_status: 'paid',
      payment_method: 'PayU',
      payment_date: new Date(),
      payment_details: {
        mihpayid,
        mode,
        bank_ref_num,
        cardnum: cardnum ? `****${cardnum.slice(-4)}` : undefined,
        txnid,
        amount
      },
      ...(paymentSession?.userId && { user_id: paymentSession.userId })
    };

    try {
      await exponentialBackoff(() => Order.findOneAndUpdate({ order_number: txnid }, updateData, { new: true }));
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Payment received but order update failed' });
    }

    delete global.paymentSessions?.[txnid];

    res.json({ success: true, message: 'Payment successful', data: { txnid, mihpayid, amount, status } });

  } catch (error) {
    const isRateLimit = error.message?.includes('Too many Requests');
    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      message: 'Payment processing failed. Contact support if charged'
    });
  }
};

exports.paymentFailure = async (req, res) => {
  try {
    const { txnid, status, error: payuError, error_Message } = req.body;

    if (!txnid) {
      return res.status(400).json({ success: false, message: 'Invalid callback data' });
    }

    try {
      await exponentialBackoff(() => Order.findOneAndUpdate(
        { order_number: txnid },
        {
          payment_status: 'failed',
          payment_method: 'PayU',
          payment_date: new Date(),
          payment_details: { txnid, status, error: payuError, error_message: error_Message }
        },
        { new: true }
      ));
    } catch (error) {
      // Log but don't fail the response
    }

    delete global.paymentSessions?.[txnid];

    res.json({ success: false, message: 'Payment failed', data: { txnid, status, error: payuError, error_message: error_Message } });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment failure processing error' });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { txnid } = req.params;
    
    if (!txnid) {
      return res.status(400).json({ success: false, message: 'Transaction ID required' });
    }

    const order = await Order.findOne({ order_number: txnid }).select('order_number payment_status payment_method payment_date total_amount');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: {
        txnid,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        payment_date: order.payment_date,
        amount: order.total_amount
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get payment status' });
  }
};

exports.getServiceHealth = async (req, res) => {
  try {
    const status = payuService.getServiceStatus();
    res.json({
      success: true,
      service: 'PayU',
      status: status.available ? 'healthy' : 'degraded',
      details: {
        available: status.available,
        queueLength: status.queueLength,
        processing: status.processing,
        circuitBreakerOpen: status.circuitBreakerOpen
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, service: 'PayU', status: 'unhealthy' });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const { txnid } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const order = await Order.findOne({ order_number: txnid, user_id: userId })
      .select('order_number total_amount payment_status payment_method payment_details status createdAt')
      .populate('user_id', 'name email phone')
      .populate('address_id');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Payment details not found' });
    }

    res.json({
      success: true,
      data: {
        txnid: order.order_number,
        amount: order.total_amount,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        payment_details: {
          mihpayid: order.payment_details?.mihpayid,
          mode: order.payment_details?.mode,
          bank_ref_num: order.payment_details?.bank_ref_num
        },
        order_status: order.status,
        created_at: order.createdAt,
        user: order.user_id,
        address: order.address_id
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
  }
};
