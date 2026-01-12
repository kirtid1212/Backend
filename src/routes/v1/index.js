const express = require('express');
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const checkoutRoutes = require('./checkout.routes');
const addressRoutes = require('./address.routes');
const orderRoutes = require('./order.routes');
const adminRoutes = require('./admin');

const router = express.Router();

router.use('/auth', authRoutes);
router.use(meRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
