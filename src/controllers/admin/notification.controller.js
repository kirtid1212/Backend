const Notification = require('../../models/Notification');
const AdminToken = require('../../models/AdminToken');
const pushNotificationService = require('../../utils/pushNotification.service');
const Order = require('../../models/Order');
const User = require('../../models/User');

/**
 * Create a new notification (internal use)
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async (data) => {
    try {
        const { title, message, type, orderId, userId, metadata } = data;

        // Check for duplicate notification
        const existing = await Notification.findOne({ orderId, type });
        if (existing) {
            console.log(`ℹ️  Notification already exists for order ${orderId} and type ${type}`);
            return existing;
        }

        // Create notification
        const notification = new Notification({
            title,
            message,
            type,
            orderId,
            userId,
            metadata,
            isRead: false
        });

        await notification.save();
        console.log(`✅ Notification created: ${type} for order ${orderId}`);

        // Send push notification to all admins
        await pushNotificationService.sendPushToAdmin({
            title,
            body: message,
            data: {
                notificationId: notification._id.toString(),
                type,
                orderId: orderId.toString(),
                userId: userId.toString(),
                ...metadata
            }
        });

        return notification;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
    }
};

/**
 * GET /api/v1/admin/notifications
 * Get all notifications with pagination and filtering
 */
const getAllNotifications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            isRead,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build filter
        const filter = {};
        if (type) filter.type = type;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'asc' ? 1 : -1;

        // Get notifications
        const notifications = await Notification.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('orderId', 'order_number total status')
            .populate('userId', 'name email')
            .lean();

        // Get total count
        const total = await Notification.countDocuments(filter);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
};

/**
 * GET /api/v1/admin/notifications/unread-count
 * Get count of unread notifications
 */
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ isRead: false });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
    }
};

/**
 * PATCH /api/v1/admin/notifications/:id/read
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
    }
};

/**
 * PATCH /api/v1/admin/notifications/read-all
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: `Marked ${result.modifiedCount} notifications as read`
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, error: 'Failed to mark all notifications as read' });
    }
};

/**
 * DELETE /api/v1/admin/notifications/:id
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, error: 'Failed to delete notification' });
    }
};

/**
 * POST /api/v1/admin/notifications/register-token
 * Register FCM token for admin
 */
const registerAdminToken = async (req, res) => {
    try {
        const { token, deviceInfo } = req.body;
        const adminId = req.user._id; // Assuming admin auth middleware sets req.user

        if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }

        // Check if token already exists
        let adminToken = await AdminToken.findOne({ token });

        if (adminToken) {
            // Update existing token
            adminToken.adminId = adminId;
            adminToken.deviceInfo = deviceInfo || adminToken.deviceInfo;
            adminToken.isActive = true;
            adminToken.lastUsed = new Date();
            await adminToken.save();
        } else {
            // Create new token
            adminToken = new AdminToken({
                adminId,
                token,
                deviceInfo,
                isActive: true
            });
            await adminToken.save();
        }

        res.json({
            success: true,
            message: 'Token registered successfully',
            data: { tokenId: adminToken._id }
        });
    } catch (error) {
        console.error('Error registering admin token:', error);
        res.status(500).json({ success: false, error: 'Failed to register token' });
    }
};

/**
 * DELETE /api/v1/admin/notifications/unregister-token
 * Unregister FCM token
 */
const unregisterAdminToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }

        await AdminToken.deactivateToken(token);

        res.json({
            success: true,
            message: 'Token unregistered successfully'
        });
    } catch (error) {
        console.error('Error unregistering admin token:', error);
        res.status(500).json({ success: false, error: 'Failed to unregister token' });
    }
};

/**
 * POST /api/v1/admin/notifications/test
 * Send test notification
 */
const sendTestNotification = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }

        const success = await pushNotificationService.testNotification(token);

        if (success) {
            res.json({
                success: true,
                message: 'Test notification sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to send test notification'
            });
        }
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ success: false, error: 'Failed to send test notification' });
    }
};

module.exports = {
    createNotification,
    getAllNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    registerAdminToken,
    unregisterAdminToken,
    sendTestNotification
};
