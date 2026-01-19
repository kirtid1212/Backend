const { getMessaging } = require('../config/firebase.config');
const AdminToken = require('../models/AdminToken');

class PushNotificationService {
    /**
     * Send push notification to all active admin tokens
     * @param {Object} notification - Notification data
     * @param {string} notification.title - Notification title
     * @param {string} notification.body - Notification body
     * @param {Object} notification.data - Additional data payload
     * @returns {Promise<Object>} - Result with success and failure counts
     */
    async sendPushToAdmin(notification) {
        try {
            const messaging = getMessaging();

            if (!messaging) {
                console.warn('⚠️  Firebase messaging not initialized. Skipping push notification.');
                return { success: 0, failure: 0, error: 'Firebase not initialized' };
            }

            // Get all active admin tokens
            const adminTokens = await AdminToken.getActiveTokens();

            if (!adminTokens || adminTokens.length === 0) {
                console.log('ℹ️  No active admin tokens found');
                return { success: 0, failure: 0, error: 'No active tokens' };
            }

            const tokens = adminTokens.map(t => t.token);

            // Prepare message payload
            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                    icon: '/icon-192x192.png', // Add your app icon path
                    badge: '/badge-72x72.png'
                },
                data: {
                    ...notification.data,
                    click_action: '/admin/notifications',
                    timestamp: new Date().toISOString()
                },
                tokens: tokens
            };

            // Send multicast message
            const response = await messaging.sendEachForMulticast(message);

            console.log(`✅ Push notifications sent: ${response.successCount} success, ${response.failureCount} failures`);

            // Handle failed tokens (deactivate them)
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                        console.error(`Failed to send to token ${idx}:`, resp.error?.message);
                    }
                });

                // Deactivate failed tokens
                await this.deactivateTokens(failedTokens);
            }

            return {
                success: response.successCount,
                failure: response.failureCount,
                tokens: tokens.length
            };
        } catch (error) {
            console.error('❌ Error sending push notification:', error);
            return { success: 0, failure: 0, error: error.message };
        }
    }

    /**
     * Send push notification to a specific token
     * @param {string} token - FCM token
     * @param {Object} notification - Notification data
     * @returns {Promise<string>} - Message ID
     */
    async sendToToken(token, notification) {
        try {
            const messaging = getMessaging();

            if (!messaging) {
                throw new Error('Firebase messaging not initialized');
            }

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                    icon: '/icon-192x192.png'
                },
                data: notification.data || {},
                token: token
            };

            const messageId = await messaging.send(message);
            console.log('✅ Message sent successfully:', messageId);

            // Update last used timestamp
            await AdminToken.findOneAndUpdate(
                { token },
                { lastUsed: new Date() }
            );

            return messageId;
        } catch (error) {
            console.error('❌ Error sending to token:', error);

            // Deactivate token if it's invalid
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                await AdminToken.deactivateToken(token);
            }

            throw error;
        }
    }

    /**
     * Deactivate multiple tokens
     * @param {Array<string>} tokens - Array of tokens to deactivate
     */
    async deactivateTokens(tokens) {
        try {
            await AdminToken.updateMany(
                { token: { $in: tokens } },
                { isActive: false }
            );
            console.log(`🔄 Deactivated ${tokens.length} invalid tokens`);
        } catch (error) {
            console.error('❌ Error deactivating tokens:', error);
        }
    }

    /**
     * Test push notification
     * @param {string} token - FCM token to test
     * @returns {Promise<boolean>} - Success status
     */
    async testNotification(token) {
        try {
            await this.sendToToken(token, {
                title: '🔔 Test Notification',
                body: 'This is a test notification from your admin panel',
                data: {
                    type: 'TEST',
                    timestamp: new Date().toISOString()
                }
            });
            return true;
        } catch (error) {
            console.error('Test notification failed:', error);
            return false;
        }
    }
}

module.exports = new PushNotificationService();
