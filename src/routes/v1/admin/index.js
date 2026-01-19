const express = require('express');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');
const adminAuthController = require('../../../controllers/admin/auth.controller');
const adminCategoryController = require('../../../controllers/admin/category.controller');
const adminProductController = require('../../../controllers/admin/product.controller');
const adminOrderController = require('../../../controllers/admin/order.controller');
const meController = require('../../../controllers/me.controller');
const notificationRoutes = require('./notification.routes');
const analyticsRoutes = require('./analytics.routes');
const customersRoutes = require('./customers.routes');
const reviewsRoutes = require('./reviews.routes');
const notificationsAdminRoutes = require('./notifications-admin.routes');
const adminUsersRoutes = require('./admin-users.routes');

const router = express.Router();

router.post('/auth/login', adminAuthController.login);

router.use(authenticate);
router.use(requireAdmin);

router.get('/me', meController.getProfile);

router.post('/categories', adminCategoryController.createCategory);
router.patch('/categories/:categoryId', adminCategoryController.updateCategory);
router.delete('/categories/:categoryId', adminCategoryController.deleteCategory);
router.post('/categories/:categoryId/image', adminCategoryController.setCategoryImage);

router.post('/products', adminProductController.createProduct);
router.patch('/products/:productId', adminProductController.updateProduct);
router.delete('/products/:productId', adminProductController.deleteProduct);
router.get('/products', adminProductController.listProducts);
router.get('/products/:productId', adminProductController.getProduct);

router.post('/products/:productId/variants', adminProductController.createVariant);
router.patch('/variants/:variantId', adminProductController.updateVariant);
router.delete('/variants/:variantId', adminProductController.deleteVariant);
router.patch('/variants/:variantId/stock', adminProductController.updateVariantStock);

router.post('/products/:productId/images', adminProductController.addProductImages);
router.delete('/products/:productId/images/:imageId', adminProductController.deleteProductImage);

router.get('/orders', adminOrderController.listOrders);
router.get('/orders/:orderId', adminOrderController.getOrder);
router.patch('/orders/:orderId/status', adminOrderController.updateOrderStatus);
router.patch('/orders/:orderId/shipment', adminOrderController.updateShipment);
router.post('/orders/:orderId/refund', adminOrderController.refundOrder);

// New admin routes
router.use('/analytics', analyticsRoutes);
router.use('/customers', customersRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/notifications-admin', notificationsAdminRoutes);
router.use('/admin-users', adminUsersRoutes);

// Legacy notification routes
router.use('/notifications', notificationRoutes);

module.exports = router;

