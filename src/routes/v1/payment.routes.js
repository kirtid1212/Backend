const express = require('express');
const paymentController = require('../../controllers/payment.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { 
  payuRateLimit, 
  preventDuplicateTransaction, 
  cachePayuResponse,
  handlePayuError 
} = require('../../middleware/payu.middleware');

const router = express.Router();

// POST: Initiate payment (requires authentication + PayU middleware)
router.post('/initiate', 
  authenticate, 
  payuRateLimit,
  preventDuplicateTransaction,
  cachePayuResponse,
  paymentController.initiatePayment
);

// POST: Payment success callback (webhook from PayU)
router.post('/success', paymentController.paymentSuccess);

// POST: Payment failure callback (webhook from PayU)
router.post('/failure', paymentController.paymentFailure);

// GET: Get payment details by transaction ID (requires authentication)
router.get('/details/:txnid', authenticate, paymentController.getPaymentDetails);

// GET: Get payment status by transaction ID (requires authentication)
router.get('/status/:txnid', authenticate, paymentController.getPaymentStatus);

// Apply PayU error handler to all routes
router.use(handlePayuError);

module.exports = router;