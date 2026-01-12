const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    sort_order: { type: Number, default: 0 },
    is_primary: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductImage', productImageSchema);
