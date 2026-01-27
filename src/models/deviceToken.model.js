const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fcmToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deviceName: {
      type: String,
      default: 'Unknown Device'
    },
    deviceType: {
      type: String,
      enum: ['web', 'android', 'ios', 'other'],
      default: 'other'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
deviceTokenSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
