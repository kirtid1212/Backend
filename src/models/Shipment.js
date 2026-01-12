const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
    carrier: { type: String, default: '' },
    tracking_id: { type: String, default: '' },
    shipped_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    status: { type: String, enum: ['created', 'in_transit', 'delivered'], default: 'created' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
