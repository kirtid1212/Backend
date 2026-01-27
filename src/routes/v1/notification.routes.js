const express = require('express');
const {
  registerDevice,
  unregisterDevice,
  getUserDevices,
  sendTestNotification,
  sendToDevice,
  sendToUser,
  sendToUsers,
  sendBroadcast,
  getStats
} = require('../../controllers/notification.controller');
const { authenticate, requireAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

// Device Registration Routes (authenticated)
router.post('/register-device', authenticate, registerDevice);
router.post('/unregister-device', authenticate, unregisterDevice);
router.get('/devices', authenticate, getUserDevices);

// Test Notification (authenticated)
router.post('/test', authenticate, sendTestNotification);

// Admin Routes
router.post('/send-to-device', authenticate, requireAdmin, sendToDevice);
router.post('/send-to-user', authenticate, requireAdmin, sendToUser);
router.post('/send-to-users', authenticate, requireAdmin, sendToUsers);
router.post('/broadcast', authenticate, requireAdmin, sendBroadcast);
router.get('/stats', authenticate, requireAdmin, getStats);

module.exports = router;
