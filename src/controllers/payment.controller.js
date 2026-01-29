const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Generate PayU hash for payment initiation
exports.initiatePayment = async (req, res) => {
  try {
    const { amount, productinfo, firstname, email, phone, orderId } = req.body;
    const userId = req.user.id; // Get authenticated user ID
    
    if (!amount || !productinfo || !firstname || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const key = process.env.PAYU_KEY;
    const salt = process.env.PAYU_SALT;
    const txnid = orderId || uuidv4();
    
    // PayU hash generation formula
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    
    // Store user ID in session or temporary storage for payment verification
    // You might want to use Redis or database for production
    global.paymentSessions = global.paymentSessions || {};
    global.paymentSessions[txnid] = { userId, email };
    
    res.json({
      success: true,
      data: {
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        hash,
        surl: `${process.env.BASE_URL}/api/v1/payment/success`,
        furl: `${process.env.BASE_URL}/api/v1/payment/failure`
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed'
    });
  }
};

// Handle payment success callback
exports.paymentSuccess = async (req, res) => {
  try {
    const { txnid, amount, productinfo, firstname, email, status, hash, key } = req.body;
    
    // Verify hash for security
    const salt = process.env.PAYU_SALT;
    const verifyHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const verifyHash = crypto.createHash('sha512').update(verifyHashString).digest('hex');
    
    if (hash !== verifyHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hash verification'
      });
    }
    
    if (status === 'success') {
      // Get user info from payment session
      const paymentSession = global.paymentSessions?.[txnid];
      
      // Update order payment status with user information
      const updateData = { 
        payment_status: 'paid',
        payment_method: 'PayU',
        payment_date: new Date()
      };
      
      if (paymentSession?.userId) {
        updateData.user_id = paymentSession.userId;
      }
      
      await Order.findOneAndUpdate(
        { order_number: txnid },
        updateData
      );
      
      // Clean up payment session
      if (global.paymentSessions?.[txnid]) {
        delete global.paymentSessions[txnid];
      }
      
      res.json({
        success: true,
        message: 'Payment successful',
        data: {
          txnid,
          amount,
          status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment failed',
        data: { txnid, status }
      });
    }
  } catch (error) {
    console.error('Payment success handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
};

// Handle payment failure callback
exports.paymentFailure = async (req, res) => {
  try {
    const { txnid, status } = req.body;
    
    // Update order payment status
    await Order.findOneAndUpdate(
      { order_number: txnid },
      { 
        payment_status: 'failed',
        payment_date: new Date()
      }
    );
    
    // Clean up payment session
    if (global.paymentSessions?.[txnid]) {
      delete global.paymentSessions[txnid];
    }
    
    res.json({
      success: false,
      message: 'Payment failed',
      data: {
        txnid,
        status
      }
    });
  } catch (error) {
    console.error('Payment failure handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment failure processing failed'
    });
  }
};

// Get payment details by transaction ID
exports.getPaymentDetails = async (req, res) => {
  try {
    const { txnid } = req.params;
    
    const order = await Order.findOne({ order_number: txnid })
      .populate('user_id', 'name email')
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
        amount: order.total,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
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
      message: 'Failed to fetch payment details'
    });
  }
};