const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    full_name: { type: String, required: true, minlength: 2 },
    phone: { type: String, required: true, match: /^\+?\d{10,15}$/ },
    address_line1: { type: String, required: true },
    address_line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    country: { type: String, default: 'India' },
    is_default: { type: Boolean, default: false }
  },
  { timestamps: true }
);

addressSchema.index({ user_id: 1, is_default: 1 });

addressSchema.statics.validateInput = function (data, requireAll = true) {
  const errors = [];

  const has = (key) => Object.prototype.hasOwnProperty.call(data, key);
  const requireField = (key, message) => {
    if (requireAll || has(key)) {
      if (!data[key]) errors.push(message);
    }
  };

  requireField('full_name', 'Full name is required');
  requireField('phone', 'Phone is required');
  requireField('address_line1', 'Address line 1 is required');
  requireField('city', 'City is required');
  requireField('state', 'State is required');
  requireField('pincode', 'Pincode is required');

  if (has('full_name') && data.full_name && data.full_name.length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  if (has('phone') && data.phone && !/^\+?\d{10,15}$/.test(data.phone)) {
    errors.push('Phone must be 10 to 15 digits');
  }

  if (has('pincode') && data.pincode && !/^\d{6}$/.test(data.pincode)) {
    errors.push('Pincode must be exactly 6 digits');
  }

  return errors;
};

module.exports = mongoose.model('Address', addressSchema);
