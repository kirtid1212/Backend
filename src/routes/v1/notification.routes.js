const express = require('express');

const {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerAdminToken,
  unregisterAdminToken,
  sendTestNotification,
  paymentSuccessNotification,
  orderDeliveredNotification
} = require('../../controllers/notification.controller');

const { authenticate, requireAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

/* =========================================================
   ADMIN NOTIFICATION MANAGEMENT
   ========================================================= */
router.get('/', authenticate, requireAdmin, getAllNotifications);
router.get('/unread-count', authenticate, requireAdmin, getUnreadCount);
router.patch('/:id/read', authenticate, requireAdmin, markAsRead);
router.patch('/read-all', authenticate, requireAdmin, markAllAsRead);
router.delete('/:id', authenticate, requireAdmin, deleteNotification);

/* =========================================================
   ADMIN TOKEN MANAGEMENT
   ========================================================= */
router.post('/register-token', authenticate, requireAdmin, registerAdminToken);
router.delete('/unregister-token', authenticate, requireAdmin, unregisterAdminToken);
router.post('/test', authenticate, requireAdmin, sendTestNotification);

/* =========================================================
   NOTIFICATION TRIGGERS
   ========================================================= */
router.post('/payment-success-v2', authenticate, paymentSuccessNotification);
router.post('/order-delivered-v2', authenticate, requireAdmin, orderDeliveredNotification);

module.exports = router;
