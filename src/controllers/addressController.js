const Address = require('../models/Address');
const AddressDB = require('../utils/addressDB');

class AddressController {
  static async getAllAddresses(req, res) {
    try {
      const userId = req.user.id;
      const addresses = await AddressDB.findByUserId(userId);
      
      res.json({
        success: true,
        data: addresses,
        count: addresses.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch addresses' });
    }
  }

  static async createAddress(req, res) {
    try {
      const userId = req.user.id;
      
      // Check address limit
      const addressCount = await AddressDB.countByUserId(userId);
      if (addressCount >= 5) {
        return res.status(400).json({ error: 'Maximum 5 addresses allowed per user' });
      }

      // Validate input
      const validationErrors = Address.validate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors.join(', ') });
      }

      const addressData = { ...req.body, user_id: userId };
      
      // If this is first address or is_default is true, handle default logic
      const existingAddresses = await AddressDB.findByUserId(userId);
      if (existingAddresses.length === 0) {
        addressData.is_default = true;
      } else if (addressData.is_default) {
        await AddressDB.unsetDefaultForUser(userId);
      }

      const address = await AddressDB.create(addressData);
      
      res.status(201).json({
        success: true,
        data: address,
        message: 'Address created successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create address' });
    }
  }

  static async updateAddress(req, res) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;

      // Check ownership
      const existingAddress = await AddressDB.findByUserIdAndId(userId, addressId);
      if (!existingAddress) {
        return res.status(404).json({ error: 'Address not found or access denied' });
      }

      // Validate input
      const validationErrors = Address.validate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors.join(', ') });
      }

      // Handle default address logic
      if (req.body.is_default) {
        await AddressDB.unsetDefaultForUser(userId);
      }

      const updatedAddress = await AddressDB.update(addressId, req.body);
      
      res.json({
        success: true,
        data: updatedAddress,
        message: 'Address updated successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update address' });
    }
  }

  static async deleteAddress(req, res) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;

      // Check ownership
      const existingAddress = await AddressDB.findByUserIdAndId(userId, addressId);
      if (!existingAddress) {
        return res.status(404).json({ error: 'Address not found or access denied' });
      }

      const wasDefault = existingAddress.is_default;
      await AddressDB.delete(addressId);

      // If deleted address was default, set another as default
      if (wasDefault) {
        const remainingAddresses = await AddressDB.findByUserId(userId);
        if (remainingAddresses.length > 0) {
          await AddressDB.update(remainingAddresses[0].id, { is_default: true });
        }
      }

      res.json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete address' });
    }
  }

  static async setDefaultAddress(req, res) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;

      // Check ownership
      const existingAddress = await AddressDB.findByUserIdAndId(userId, addressId);
      if (!existingAddress) {
        return res.status(404).json({ error: 'Address not found or access denied' });
      }

      const updatedAddress = await AddressDB.setDefault(userId, addressId);
      
      res.json({
        success: true,
        data: updatedAddress,
        message: 'Default address updated successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to set default address' });
    }
  }
}

module.exports = AddressController;