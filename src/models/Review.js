const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending',
    index: true 
  },
  rejectionReason: { type: String, maxlength: 500 },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);
