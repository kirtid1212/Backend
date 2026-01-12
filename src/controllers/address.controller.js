const Address = require('../models/Address');

const listAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.find({ user_id: userId })
      .sort({ is_default: -1, createdAt: -1 });

    res.json({ success: true, data: addresses, count: addresses.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
};

const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Address.countDocuments({ user_id: userId });
    if (count >= 5) {
      return res.status(400).json({ message: 'Maximum 5 addresses allowed' });
    }

    const errors = Address.validateInput(req.body, true);
    if (errors.length) {
      return res.status(400).json({ message: errors.join(', ') });
    }

    const addressData = { ...req.body, user_id: userId };

    if (count === 0) {
      addressData.is_default = true;
    } else if (addressData.is_default) {
      await Address.updateMany({ user_id: userId }, { is_default: false });
    }

    const address = await Address.create(addressData);
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create address' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;

    const existing = await Address.findOne({ _id: addressId, user_id: userId });
    if (!existing) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const errors = Address.validateInput(req.body, false);
    if (errors.length) {
      return res.status(400).json({ message: errors.join(', ') });
    }

    if (req.body.is_default) {
      await Address.updateMany({ user_id: userId }, { is_default: false });
    }

    const updated = await Address.findByIdAndUpdate(addressId, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update address' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;

    const address = await Address.findOne({ _id: addressId, user_id: userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = address.is_default;
    await Address.deleteOne({ _id: addressId });

    if (wasDefault) {
      const remaining = await Address.find({ user_id: userId }).sort({ createdAt: -1 });
      if (remaining.length) {
        await Address.updateOne({ _id: remaining[0]._id }, { is_default: true });
      }
    }

    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete address' });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;

    const address = await Address.findOne({ _id: addressId, user_id: userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await Address.updateMany({ user_id: userId }, { is_default: false });
    await Address.updateOne({ _id: addressId }, { is_default: true });

    const updated = await Address.findById(addressId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set default address' });
  }
};

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
