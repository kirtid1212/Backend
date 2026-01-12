const mongoose = require('mongoose');

const checkoutItemSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const checkoutSessionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [checkoutItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    mode: { type: String, enum: ['buyNow'], default: 'buyNow' },
    status: { type: String, enum: ['active', 'completed', 'expired'], default: 'active' },
    expires_at: { type: Date, required: true }
  },
  { timestamps: true }
);

checkoutSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('CheckoutSession', checkoutSessionSchema);
