const express = require('express');
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const checkoutRoutes = require('./checkout.routes');
const addressRoutes = require('./address.routes');
const orderRoutes = require('./order.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin');
const paypalRoutes = require('../paypal.routes');
const paymentRoutes = require('./payment.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use(meRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/paypal', paypalRoutes);
router.use('/payment', paymentRoutes);

module.exports = router;
