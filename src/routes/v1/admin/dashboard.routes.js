const express = require('express');
const adminDashboardController = require('../../../controllers/admin/dashboard.controller');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard/stats', adminDashboardController.getStats);

// Get chart data
router.get('/dashboard/chart', adminDashboardController.getChartData);

// Get top products
router.get('/dashboard/top-products', adminDashboardController.getTopProducts);

// Get order status distribution
router.get('/dashboard/order-status', adminDashboardController.getOrderStatusDistribution);

// Get user growth data
router.get('/dashboard/user-growth', adminDashboardController.getUserGrowth);

// Get category performance
router.get('/dashboard/category-performance', adminDashboardController.getCategoryPerformance);

// Get recent orders
router.get('/dashboard/recent-orders', adminDashboardController.getRecentOrders);

// Get low stock products
router.get('/dashboard/low-stock', adminDashboardController.getLowStockProducts);

module.exports = router;

