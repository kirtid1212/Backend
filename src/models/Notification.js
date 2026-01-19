const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['ORDER_PLACED', 'PAYMENT_SUCCESS', 'DELIVERY_SUCCESS'],
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      orderNumber: String,
      amount: Number,
      userName: String
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
notificationSchema.index({ type: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ orderId: 1, type: 1 }, { unique: true }); // Prevent duplicate notifications for same order+type

// Virtual for formatted date
notificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toISOString();
});

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
