const express = require('express');
const paymentController = require('../../controllers/payment.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

// POST: Initiate payment (requires authentication)
router.post('/initiate', authenticate, paymentController.initiatePayment);

// POST: Payment success callback (webhook from PayU)
router.post('/success', paymentController.paymentSuccess);

// POST: Payment failure callback (webhook from PayU)
router.post('/failure', paymentController.paymentFailure);

// GET: Get payment details by transaction ID (requires authentication)
router.get('/details/:txnid', authenticate, paymentController.getPaymentDetails);

module.exports = router;