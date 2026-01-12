const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    brand: { type: String, default: '' },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
    is_featured: { type: Boolean, default: false },
    is_trending: { type: Boolean, default: false },
    tags: [{ type: String }],
    available_sizes: [{ type: String }],
    available_colors: [{ type: String }],
    sold_count: { type: Number, default: 0 }
  },
  { timestamps: true }
);

productSchema.index({ category_id: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
