const admin = require('firebase-admin');

/**
 * Firestore utility functions for storing and retrieving FCM tokens
 * Collection: user_devices
 * Document structure:
 * {
 *   userId: string,
 *   token: string (FCM token),
 *   role: string (admin, user),
 *   platform: string (web, android, ios),
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 *   isActive: boolean
 * }
 */

const db = admin.firestore();
const COLLECTION = 'user_devices';

/**
 * Save or update device token in Firestore
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM token
 * @param {string} role - User role (admin, user)
 * @param {string} platform - Platform (web, android, ios)
 * @returns {Promise<object>} - Result with success status
 */
const saveDeviceToken = async (userId, fcmToken, role = 'user', platform = 'web') => {
  try {
    const docId = `${userId}_${fcmToken.substring(0, 20)}`; // Create unique doc ID
    const now = admin.firestore.Timestamp.now();

    // Get existing doc if it exists
    const existingDoc = await db.collection(COLLECTION).doc(docId).get();

    if (existingDoc.exists) {
      // Update existing
      await db.collection(COLLECTION).doc(docId).update({
        updatedAt: now,
        isActive: true,
        platform
      });
      console.log(`✓ Updated device token for user ${userId}`);
      return { success: true, isNew: false, message: 'Token updated' };
    } else {
      // Create new
      await db.collection(COLLECTION).doc(docId).set({
        userId,
        token: fcmToken,
        role,
        platform,
        createdAt: now,
        updatedAt: now,
        isActive: true
      });
      console.log(`✓ Saved new device token for user ${userId}`);
      return { success: true, isNew: true, message: 'Token saved' };
    }
  } catch (error) {
    console.error('Error saving device token to Firestore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<array>} - Array of tokens
 */
const getUserTokens = async (userId) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    return tokens;
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return [];
  }
};

/**
 * Get all admin tokens
 * @returns {Promise<array>} - Array of admin tokens
 */
const getAdminTokens = async () => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('role', '==', 'admin')
      .where('isActive', '==', true)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    return tokens;
  } catch (error) {
    console.error('Error fetching admin tokens:', error);
    return [];
  }
};

/**
 * Get all active tokens (for broadcast)
 * @returns {Promise<array>} - Array of all active tokens
 */
const getAllTokens = async () => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('isActive', '==', true)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    return tokens;
  } catch (error) {
    console.error('Error fetching all tokens:', error);
    return [];
  }
};

/**
 * Mark token as inactive
 * @param {string} fcmToken - FCM token to deactivate
 * @returns {Promise<object>} - Result
 */
const markTokenInactive = async (fcmToken) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('token', '==', fcmToken)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Token not found' };
    }

    snapshot.forEach(async doc => {
      await doc.ref.update({
        isActive: false,
        updatedAt: admin.firestore.Timestamp.now()
      });
    });

    return { success: true, message: 'Token marked inactive' };
  } catch (error) {
    console.error('Error marking token inactive:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get device count stats
 * @returns {Promise<object>} - Stats
 */
const getStats = async () => {
  try {
    const allSnapshot = await db.collection(COLLECTION).get();
    const activeSnapshot = await db.collection(COLLECTION)
      .where('isActive', '==', true)
      .get();

    return {
      total: allSnapshot.size,
      active: activeSnapshot.size,
      inactive: allSnapshot.size - activeSnapshot.size
    };
  } catch (error) {
    console.error('Error getting Firestore stats:', error);
    return { total: 0, active: 0, inactive: 0 };
  }
};

module.exports = {
  saveDeviceToken,
  getUserTokens,
  getAdminTokens,
  getAllTokens,
  markTokenInactive,
  getStats
};
