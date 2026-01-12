const Address = require('../models/Address');

class AddressDB {
  static async findByUserId(userId) {
    return await Address.find({ user_id: userId }).sort({ is_default: -1, createdAt: -1 });
  }

  static async findById(id) {
    return await Address.findById(id);
  }

  static async findByUserIdAndId(userId, id) {
    return await Address.findOne({ _id: id, user_id: userId });
  }

  static async create(addressData) {
    const address = new Address(addressData);
    return await address.save();
  }

  static async update(id, updateData) {
    return await Address.findByIdAndUpdate(id, updateData, { new: true });
  }

  static async delete(id) {
    const result = await Address.findByIdAndDelete(id);
    return !!result;
  }

  static async unsetDefaultForUser(userId) {
    await Address.updateMany({ user_id: userId }, { is_default: false });
  }

  static async setDefault(userId, addressId) {
    const session = await Address.startSession();
    try {
      await session.withTransaction(async () => {
        await Address.updateMany({ user_id: userId }, { is_default: false }, { session });
        await Address.findByIdAndUpdate(addressId, { is_default: true }, { session });
      });
      return await Address.findById(addressId);
    } finally {
      await session.endSession();
    }
  }

  static async countByUserId(userId) {
    return await Address.countDocuments({ user_id: userId });
  }

  static async getDefaultByUserId(userId) {
    return await Address.findOne({ user_id: userId, is_default: true });
  }
}

module.exports = AddressDB;