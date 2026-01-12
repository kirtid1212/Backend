const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const orderController = require('../../controllers/order.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', orderController.createOrder);
router.get('/', orderController.listOrders);
router.get('/:orderId/tracking', orderController.trackOrder);
router.get('/:orderId', orderController.getOrderById);
router.post('/:orderId/cancel', orderController.cancelOrder);

module.exports = router;
