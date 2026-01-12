const express = require('express');
const OrderController = require('../controllers/orderController');

const router = express.Router();

router.post('/orders/create', OrderController.createOrder);
router.get('/orders', OrderController.getAllOrders);
router.get('/orders/:id', OrderController.getOrderById);
router.post('/orders/:id/cancel', OrderController.cancelOrder);
router.get('/orders/:id/invoice', OrderController.getOrderInvoice);

module.exports = router;