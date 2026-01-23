const express = require('express');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');
const adminAuthController = require('../../../controllers/admin/auth.controller');
const adminCategoryController = require('../../../controllers/admin/category.controller');
const adminProductController = require('../../../controllers/admin/product.controller');
const adminOrderController = require('../../../controllers/admin/order.controller');
const adminReviewController = require('../../../controllers/admin/review.controller');
const adminUserController = require('../../../controllers/admin/user.controller');
const adminDashboardController = require('../../../controllers/admin/dashboard.controller');
const meController = require('../../../controllers/me.controller');

const router = express.Router();

router.post('/auth/login', adminAuthController.login);

router.use(authenticate);
router.use(requireAdmin);

router.get('/me', meController.getProfile);

// Categories
router.post('/categories', adminCategoryController.createCategory);
router.patch('/categories/:categoryId', adminCategoryController.updateCategory);
router.delete('/categories/:categoryId', adminCategoryController.deleteCategory);
router.post('/categories/:categoryId/image', adminCategoryController.setCategoryImage);

// Products
router.post('/products', adminProductController.createProduct);
router.patch('/products/:productId', adminProductController.updateProduct);
router.delete('/products/:productId', adminProductController.deleteProduct);
router.get('/products', adminProductController.listProducts);
router.get('/products/:productId', adminProductController.getProduct);

// Product Variants
router.post('/products/:productId/variants', adminProductController.createVariant);
router.patch('/variants/:variantId', adminProductController.updateVariant);
router.delete('/variants/:variantId', adminProductController.deleteVariant);
router.patch('/variants/:variantId/stock', adminProductController.updateVariantStock);

// Product Images
router.post('/products/:productId/images', adminProductController.addProductImages);
router.delete('/products/:productId/images/:imageId', adminProductController.deleteProductImage);

// Orders
router.get('/orders', adminOrderController.listOrders);
router.get('/orders/:orderId', adminOrderController.getOrder);
router.patch('/orders/:orderId/status', adminOrderController.updateOrderStatus);
router.patch('/orders/:orderId/shipment', adminOrderController.updateShipment);
router.post('/orders/:orderId/refund', adminOrderController.refundOrder);

// Reviews
router.get('/reviews', adminReviewController.listReviews);
router.get('/reviews/stats', adminReviewController.getReviewStats);
router.get('/reviews/product/:productId', adminReviewController.getProductReviews);
router.patch('/reviews/bulk/update-status', adminReviewController.bulkUpdateStatus);
router.get('/reviews/:reviewId', adminReviewController.getReview);
router.patch('/reviews/:reviewId/approve', adminReviewController.approveReview);
router.patch('/reviews/:reviewId/reject', adminReviewController.rejectReview);
router.delete('/reviews/:reviewId', adminReviewController.deleteReview);

// Users/Customers
router.get('/users', adminUserController.listUsers);
router.get('/users/stats', adminUserController.getUserStats);
router.get('/users/:userId', adminUserController.getUser);
router.get('/users/:userId/orders', adminUserController.getUserOrders);
router.patch('/users/:userId', adminUserController.updateUser);
router.patch('/users/:userId/status', adminUserController.updateUserStatus);
router.delete('/users/:userId', adminUserController.deleteUser);

// Dashboard/Analytics
router.get('/dashboard/stats', adminDashboardController.getStats);
router.get('/dashboard/chart', adminDashboardController.getChartData);
router.get('/dashboard/top-products', adminDashboardController.getTopProducts);
router.get('/dashboard/order-status', adminDashboardController.getOrderStatusDistribution);
router.get('/dashboard/user-growth', adminDashboardController.getUserGrowth);
router.get('/dashboard/category-performance', adminDashboardController.getCategoryPerformance);
router.get('/dashboard/recent-orders', adminDashboardController.getRecentOrders);
router.get('/dashboard/low-stock', adminDashboardController.getLowStockProducts);

module.exports = router;
