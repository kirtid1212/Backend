const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
  is_verified: { type: Boolean, default: false }
}, {
  timestamps: true
});

reviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });
reviewSchema.index({ product_id: 1, rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);