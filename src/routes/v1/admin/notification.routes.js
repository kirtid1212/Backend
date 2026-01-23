const express = require('express');
const router = express.Router();
const notificationController = require('../../../controllers/admin/notification.controller');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Token management
router.post('/register-token', notificationController.registerAdminToken);
router.delete('/unregister-token', notificationController.unregisterAdminToken);
router.post('/test', notificationController.sendTestNotification);

// Notification management
router.get('/', notificationController.getAllNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
