const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    price: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    sku: { type: String, default: '' },
    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

variantSchema.index({ product_id: 1, size: 1, color: 1 });

module.exports = mongoose.model('Variant', variantSchema);
