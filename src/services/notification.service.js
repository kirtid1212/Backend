const admin = require('firebase-admin');
const DeviceToken = require('../models/deviceToken.model');

// Initialize Firebase Admin SDK (called from server.js)
const initializeFirebase = () => {
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    
    if (!serviceAccountPath) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY_PATH not set in environment');
      return false;
    }

    try {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error.message);
      return false;
    }
  }
  return true;
};

// Send notification to single device
const sendNotificationToDevice = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      token: fcmToken
    };

    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Handle invalid token
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/mismatched-credential' ||
        error.code === 'messaging/message-rate-exceeded') {
      // Mark token as inactive
      await DeviceToken.updateOne({ fcmToken }, { isActive: false });
    }
    
    return { success: false, error: error.message };
  }
};

// Send notification to user (all active devices)
const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    const deviceTokens = await DeviceToken.find({
      userId,
      isActive: true
    });

    if (!deviceTokens.length) {
      return { success: false, error: 'No active devices found for user' };
    }

    const tokens = deviceTokens.map(dt => dt.fcmToken);
    
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };

    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens
    });

    console.log('Multicast notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      // Mark failed tokens as inactive
      if (failedTokens.length > 0) {
        await DeviceToken.updateMany(
          { fcmToken: { $in: failedTokens } },
          { isActive: false }
        );
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to multiple users
const sendNotificationToUsers = async (userIds, title, body, data = {}) => {
  try {
    const deviceTokens = await DeviceToken.find({
      userId: { $in: userIds },
      isActive: true
    });

    if (!deviceTokens.length) {
      return { success: false, error: 'No active devices found' };
    }

    const tokens = deviceTokens.map(dt => dt.fcmToken);
    
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };

    // Send in batches (FCM limit is 500 per request)
    const batchSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const response = await admin.messaging().sendMulticast({
        ...message,
        tokens: batch
      });

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      // Mark failed tokens as inactive
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(batch[idx]);
          }
        });

        if (failedTokens.length > 0) {
          await DeviceToken.updateMany(
            { fcmToken: { $in: failedTokens } },
            { isActive: false }
          );
        }
      }
    }

    return {
      success: true,
      successCount: totalSuccess,
      failureCount: totalFailure
    };
  } catch (error) {
    console.error('Error sending notifications to multiple users:', error);
    return { success: false, error: error.message };
  }
};

// Send notification with custom payload (advanced)
const sendCustomNotification = async (tokens, notification, data = {}, options = {}) => {
  try {
    const message = {
      notification,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      ...options
    };

    if (Array.isArray(tokens)) {
      // Multiple tokens
      message.tokens = tokens;
      const response = await admin.messaging().sendMulticast(message);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } else {
      // Single token
      message.token = tokens;
      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    }
  } catch (error) {
    console.error('Error sending custom notification:', error);
    return { success: false, error: error.message };
  }
};

// Register device token for user
const registerDeviceToken = async (userId, fcmToken, deviceName, deviceType) => {
  try {
    // Check if token already exists for this user
    let deviceToken = await DeviceToken.findOne({ userId, fcmToken });

    if (deviceToken) {
      // Update existing token
      deviceToken.lastUsed = new Date();
      deviceToken.isActive = true;
      deviceToken.deviceName = deviceName;
      deviceToken.deviceType = deviceType;
      await deviceToken.save();
      return { success: true, message: 'Device token updated', isNew: false };
    } else {
      // Create new token
      deviceToken = new DeviceToken({
        userId,
        fcmToken,
        deviceName,
        deviceType,
        isActive: true
      });
      await deviceToken.save();
      return { success: true, message: 'Device token registered', isNew: true };
    }
  } catch (error) {
    console.error('Error registering device token:', error);
    return { success: false, error: error.message };
  }
};

// Unregister device token
const unregisterDeviceToken = async (fcmToken) => {
  try {
    await DeviceToken.updateOne({ fcmToken }, { isActive: false });
    return { success: true, message: 'Device token unregistered' };
  } catch (error) {
    console.error('Error unregistering device token:', error);
    return { success: false, error: error.message };
  }
};

// Get user's active devices
const getUserDevices = async (userId) => {
  try {
    const devices = await DeviceToken.find(
      { userId, isActive: true },
      '-fcmToken' // Exclude token from response for security
    );
    return { success: true, devices };
  } catch (error) {
    console.error('Error getting user devices:', error);
    return { success: false, error: error.message };
  }
};

// Get notification stats
const getNotificationStats = async () => {
  try {
    const totalDevices = await DeviceToken.countDocuments();
    const activeDevices = await DeviceToken.countDocuments({ isActive: true });
    const inactiveDevices = await DeviceToken.countDocuments({ isActive: false });
    const devicesByType = await DeviceToken.aggregate([
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      success: true,
      stats: {
        totalDevices,
        activeDevices,
        inactiveDevices,
        devicesByType
      }
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeFirebase,
  sendNotificationToDevice,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendCustomNotification,
  registerDeviceToken,
  unregisterDeviceToken,
  getUserDevices,
  getNotificationStats
};
