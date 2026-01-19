const express = require('express');
const notificationsController = require('../../../controllers/admin/notifications.controller');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get all notifications
router.get('/', notificationsController.getAllNotifications);

// Get notification statistics
router.get('/stats', notificationsController.getNotificationStats);

// Get user notifications
router.get('/user/:userId', notificationsController.getUserNotifications);

// Send notification
router.post('/send', notificationsController.sendNotification);

// Send bulk notifications
router.post('/send-bulk', notificationsController.sendBulkNotifications);

// Mark notification as read
router.patch('/:notificationId/read', notificationsController.markAsRead);

// Mark all as read
router.patch('/user/:userId/read-all', notificationsController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationsController.deleteNotification);

// Clear old notifications
router.delete('/clear/old', notificationsController.clearOldNotifications);

module.exports = router;
