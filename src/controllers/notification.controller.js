const {
  sendNotificationToDevice,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendCustomNotification,
  registerDeviceToken,
  unregisterDeviceToken,
  getUserDevices,
  getNotificationStats
} = require('../services/notification.service');

// Register/Update device token
exports.registerDevice = async (req, res) => {
  try {
    const { fcmToken, deviceName, deviceType } = req.body;
    const userId = req.user._id;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const result = await registerDeviceToken(userId, fcmToken, deviceName, deviceType);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(result.isNew ? 201 : 200).json(result);
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
};

// Unregister device token
exports.unregisterDevice = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const result = await unregisterDeviceToken(fcmToken);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ error: 'Failed to unregister device' });
  }
};

// Get user's devices
exports.getUserDevices = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await getUserDevices(userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting user devices:', error);
    res.status(500).json({ error: 'Failed to get user devices' });
  }
};

// Send test notification to user
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title = 'Test Notification', body = 'This is a test notification from the server' } = req.body;

    const result = await sendNotificationToUser(userId, title, body, {
      type: 'test',
      action: 'test_notification'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
};

// Send notification to specific device (admin only)
exports.sendToDevice = async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;

    if (!fcmToken || !title || !body) {
      return res.status(400).json({ error: 'fcmToken, title, and body are required' });
    }

    const result = await sendNotificationToDevice(fcmToken, title, body, data);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending notification to device:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Send notification to specific user (admin only)
exports.sendToUser = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body are required' });
    }

    const result = await sendNotificationToUser(userId, title, body, data);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending notification to user:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Send notification to multiple users (admin only)
exports.sendToUsers = async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({ error: 'userIds (array), title, and body are required' });
    }

    const result = await sendNotificationToUsers(userIds, title, body, data);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending notifications to multiple users:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
};

// Send broadcast notification (admin only)
exports.sendBroadcast = async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }

    // Get all active user devices
    const DeviceToken = require('../models/deviceToken.model');
    const devices = await DeviceToken.find({ isActive: true }, 'fcmToken userId');

    if (!devices.length) {
      return res.status(400).json({ error: 'No active devices found' });
    }

    const userIds = [...new Set(devices.map(d => d.userId.toString()))];
    const result = await sendNotificationToUsers(userIds, title, body, data);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      message: `Broadcast sent to ${result.successCount} devices across ${userIds.length} users`
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
};

// Get notification statistics (admin only)
exports.getStats = async (req, res) => {
  try {
    const result = await getNotificationStats();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ error: 'Failed to get notification stats' });
  }
};
