const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    image_url: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

categorySchema.index({ is_active: 1, sort_order: 1 });

module.exports = mongoose.model('Category', categorySchema);
