const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order_number: { type: String, unique: true, required: true },
    items: [orderItemSchema],
    address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    payment_method: { type: String, enum: ['COD', 'PayU'], default: 'COD' },
    payment_status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    notes: { type: String, default: '' },
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', default: null },
    status_history: [statusHistorySchema]
  },
  { timestamps: true }
);

orderSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
