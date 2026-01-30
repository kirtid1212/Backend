const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { generatePaymentHash, verifyPaymentHash } = require('../../payu');
const { exponentialBackoff } = require('../middleware/payu.middleware');

/**
 * Initiate Payment - Generate payment parameters for Flutter SDK
 */
exports.initiatePayment = async (req, res) => {
  try {
    let{
      amount,
      productinfo,
      firstname,
      email,
      phone,
      orderId,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      userCredential
    } = req.body;

    const userId = req.user.id;

    if (!amount || !productinfo || !firstname || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, productinfo, firstname, email, phone'
      });
    }

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount provided"
      });
    }

    amount = amount = parseFloat(amount).toFixed(2);

    const key = process.env.PAYU_KEY;
    const salt = process.env.PAYU_SALT;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const environment = process.env.PAYU_ENVIRONMENT || "1";
    const txnid = orderId || `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    if (!key || !salt) {
      return res.status(500).json({
        success: false,
        message: 'PayU configuration missing. Please set PAYU_KEY and PAYU_SALT'
      });
    }

    // Check if transaction already exists
    const existingOrder = await Order.findOne({ order_number: txnid });
    if (existingOrder && existingOrder.payment_status === 'paid') {
      return res.status(409).json({
        success: false,
        message: 'Transaction already completed',
        error: 'TRANSACTION_ALREADY_EXISTS'
      });
    }

    // Generate payment hash with error handling
    let hash;
    try {
      hash = await exponentialBackoff(() => {
        return generatePaymentHash({
          key,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5
        });
      });
    } catch (error) {
      console.error('Hash generation failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Payment initialization failed. Please try again.',
        error: 'HASH_GENERATION_FAILED'
      });
    }

    // Store payment session
    global.paymentSessions = global.paymentSessions || {};
    global.paymentSessions[txnid] = {
      userId,
      email,
      amount,
      productinfo,
      firstname,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      createdAt: new Date()
    };

    console.log(`Payment initiated: ${txnid} for user: ${userId}`);

    // Return all parameters required by Flutter CheckoutPro SDK
    res.json({
      success: true,
      data: {
        key,
        txnid,
        amount: amount.toString(),
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
    console.error('Payment initiation error:', error);
    
    // Handle specific PayU errors
    if (error.message?.includes('Too many Requests')) {
      return res.status(429).json({
        success: false,
        message: 'Too many payment requests. Please try again in 60 seconds.',
        error: 'PAYU_RATE_LIMIT',
        retryAfter: 60
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed. Please try again.',
      error: 'PAYMENT_INITIATION_FAILED'
    });
  }
};

// Handle payment success callback
exports.paymentSuccess = async (req, res) => {
  try {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      hash,
      key,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      mihpayid,
      mode,
      bank_ref_num,
      cardnum
    } = req.body;

    console.log(`Payment success callback received for txnid: ${txnid}`);

    // Verify hash for security with error handling
    let isValidHash;
    try {
      isValidHash = await exponentialBackoff(() => {
        return verifyPaymentHash({
          key,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          status,
          receivedHash: hash,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5
        });
      });
    } catch (error) {
      console.error('Hash verification failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Payment verification failed',
        error: 'HASH_VERIFICATION_FAILED'
      });
    }

    if (!isValidHash) {
      console.error(`Invalid hash verification for txnid: ${txnid}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid hash verification'
      });
    }

    if (status === 'success') {
      // Check for duplicate payment processing
      const existingOrder = await Order.findOne({ order_number: txnid });
      if (existingOrder && existingOrder.payment_status === 'paid') {
        console.log(`Duplicate payment success for txnid: ${txnid}`);
        return res.json({
          success: true,
          message: 'Payment already processed',
          data: {
            txnid,
            mihpayid: existingOrder.payment_details?.mihpayid,
            amount,
            status: 'already_processed'
          }
        });
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
        }
      };

      if (paymentSession?.userId) {
        updateData.user_id = paymentSession.userId;
      }

      try {
        await exponentialBackoff(async () => {
          return await Order.findOneAndUpdate(
            { order_number: txnid },
            updateData,
            { new: true }
          );
        });
      } catch (error) {
        console.error('Order update failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Payment received but order update failed',
          error: 'ORDER_UPDATE_FAILED'
        });
      }

      if (global.paymentSessions?.[txnid]) {
        delete global.paymentSessions[txnid];
      }

      console.log(`Payment successful for txnid: ${txnid}`);

      res.json({
        success: true,
        message: 'Payment successful',
        data: {
          txnid,
          mihpayid,
          amount,
          status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment status is not successful',
        data: { txnid, status }
      });
    }

  } catch (error) {
    console.error('Payment success handler error:', error);
    
    // Handle specific errors
    if (error.message?.includes('Too many Requests')) {
      return res.status(429).json({
        success: false,
        message: 'Payment service busy. Please contact support if payment was deducted.',
        error: 'PAYU_RATE_LIMIT'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Payment processing failed. Please contact support if payment was deducted.',
      error: 'PAYMENT_PROCESSING_FAILED'
    });
  }
};

// Handle payment failure callback
exports.paymentFailure = async (req, res) => {
  try {
    const {
      txnid,
      status,
      error: payuError,
      error_Message
    } = req.body;

    console.log(`Payment failure callback received for txnid: ${txnid}`);

    try {
      await exponentialBackoff(async () => {
        return await Order.findOneAndUpdate(
          { order_number: txnid },
          {
            payment_status: 'failed',
            payment_method: 'PayU',
            payment_date: new Date(),
            payment_details: {
              txnid,
              status,
              error: payuError,
              error_message: error_Message
            }
          },
          { new: true }
        );
      });
    } catch (error) {
      console.error('Order update failed on payment failure:', error);
    }

    // Clean up payment session
    if (global.paymentSessions?.[txnid]) {
      delete global.paymentSessions[txnid];
    }

    console.log(`Payment failed for txnid: ${txnid}, status: ${status}`);

    res.json({
      success: false,
      message: 'Payment failed',
      data: {
        txnid,
        status,
        error: payuError,
        error_message: error_Message
      }
    });

  } catch (error) {
    console.error('Payment failure handler error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Payment failure processing error',
      error: 'PAYMENT_FAILURE_PROCESSING_FAILED'
    });
  }
};

/**
 * Get payment status
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { txnid } = req.params;
    
    if (!txnid) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    const order = await Order.findOne({ order_number: txnid });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
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
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: 'GET_PAYMENT_STATUS_FAILED'
    });
  }
};

/**
 * Get payment details by transaction ID
 */
exports.getPaymentDetails = async (req, res) => {
  try {
    const { txnid } = req.params;

    const order = await Order.findOne({ order_number: txnid })
      .populate('user_id', 'name email phone')
      .populate('address_id');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Payment details not found'
      });
    }

    res.json({
      success: true,
      data: {
        txnid: order.order_number,
        amount: order.total_amount,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        payment_details: order.payment_details,
        order_status: order.status,
        created_at: order.createdAt,
        user: order.user_id,
        address: order.address_id
      }
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: 'FETCH_DETAILS_FAILED'
    });
  }
};