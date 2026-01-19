const Notification = require('../../models/Notification');
const User = require('../../models/User');

/**
 * Get All Notifications
 */
exports.getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    const isRead = req.query.isRead;

    const skip = (page - 1) * limit;
    let query = {};

    if (type) {
      query.type = type;
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .populate('orderId', 'orderNumber'),
      Notification.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get User Notifications
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('orderId'),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark Notification as Read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark All Notifications as Read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Send Notification to User
 */
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type, orderId, metadata } = req.body;

    // Validate required fields
    if (!userId || !title || !message || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, title, message, and type are required' 
      });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      type,
      orderId,
      metadata: metadata || {}
    });

    await notification.save();

    // TODO: Send FCM push notification
    // await sendPushNotification(userId, title, message);

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Send Bulk Notifications
 */
exports.sendBulkNotifications = async (req, res) => {
  try {
    const { userIds, title, message, type, metadata } = req.body;

    if (!Array.isArray(userIds) || !title || !message || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request format' 
      });
    }

    const notifications = userIds.map(userId => ({
      userId,
      title,
      message,
      type,
      metadata: metadata || {}
    }));

    const result = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `${result.length} notifications sent successfully`,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Notification Statistics
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const [
      totalNotifications,
      readNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByDate
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: true }),
      Notification.countDocuments({ isRead: false }),
      Notification.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      Notification.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        readNotifications,
        unreadNotifications,
        notificationsByType,
        notificationsByDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Clear Old Notifications
 */
exports.clearOldNotifications = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await Notification.deleteMany({
      createdAt: { $lt: date },
      isRead: true
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} old notifications deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
