const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const checkoutController = require('../../controllers/checkout.controller');

const router = express.Router();

router.use(authenticate);

router.post('/buy-now', checkoutController.createBuyNow);
router.get('/session', checkoutController.getSession);
router.get('/summary', checkoutController.getSummary);

module.exports = router;
