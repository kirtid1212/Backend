const express = require('express');
const analyticsController = require('../../../controllers/admin/analytics.controller');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Dashboard summary
router.get('/summary', analyticsController.getDashboardSummary);

// Revenue analytics
router.get('/revenue', analyticsController.getRevenueChart);

// Product analytics
router.get('/top-products', analyticsController.getTopProducts);
router.get('/low-stock', analyticsController.getLowStockProducts);

// Order analytics
router.get('/order-status', analyticsController.getOrderStatusDistribution);

// Customer analytics
router.get('/user-growth', analyticsController.getUserGrowth);

// Category analytics
router.get('/category-performance', analyticsController.getCategoryPerformance);

// Recent orders
router.get('/recent-orders', analyticsController.getRecentOrders);

module.exports = router;
