const mongoose = require('mongoose');

const adminTokenSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deviceInfo: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastUsed: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
adminTokenSchema.index({ adminId: 1, isActive: 1 });

/**
 * Get all active tokens
 * @returns {Promise<Array>} - Array of active admin tokens
 */
adminTokenSchema.statics.getActiveTokens = async function() {
  return this.find({ isActive: true });
};

/**
 * Deactivate a token
 * @param {string} token - The FCM token to deactivate
 * @returns {Promise<Object>} - Update result
 */
adminTokenSchema.statics.deactivateToken = async function(token) {
  return this.updateOne(
    { token },
    { isActive: false }
  );
};

/**
 * Deactivate tokens by admin ID
 * @param {string} adminId - The admin ID
 * @returns {Promise<Object>} - Update result
 */
adminTokenSchema.statics.deactivateTokensByAdminId = async function(adminId) {
  return this.updateMany(
    { adminId },
    { isActive: false }
  );
};

/**
 * Find token by token string
 * @param {string} token - The FCM token
 * @returns {Promise<Object|null>} - Token document or null
 */
adminTokenSchema.statics.findByToken = async function(token) {
  return this.findOne({ token });
};

/**
 * Check if token exists and is active
 * @param {string} token - The FCM token
 * @returns {Promise<boolean>}
 */
adminTokenSchema.statics.isTokenActive = async function(token) {
  const tokenDoc = await this.findOne({ token, isActive: true });
  return !!tokenDoc;
};

module.exports = mongoose.model('AdminToken', adminTokenSchema);

