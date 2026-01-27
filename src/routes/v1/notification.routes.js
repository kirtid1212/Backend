const express = require('express');
const notificationController = require('../../controllers/notification.controller');
const auth = require('../../middleware/auth.middleware');

const router = express.Router();

// Device Registration Routes (authenticated)
router.post('/register-device', auth, notificationController.registerDevice);
router.post('/unregister-device', auth, notificationController.unregisterDevice);
router.get('/devices', auth, notificationController.getUserDevices);

// Test Notification (authenticated)
router.post('/test', auth, notificationController.sendTestNotification);

// Admin Routes
router.post('/send-to-device', auth, notificationController.sendToDevice); // Admin only
router.post('/send-to-user', auth, notificationController.sendToUser); // Admin only
router.post('/send-to-users', auth, notificationController.sendToUsers); // Admin only
router.post('/broadcast', auth, notificationController.sendBroadcast); // Admin only
router.get('/stats', auth, notificationController.getStats); // Admin only

module.exports = router;
