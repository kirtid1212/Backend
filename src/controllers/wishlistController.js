const Wishlist = require('../models/Wishlist');
const WishlistDB = require('../utils/wishlistDB');

class WishlistController {
  static async getWishlist(req, res) {
    try {
      const userId = req.user.id;
      const wishlistItems = await WishlistDB.findByUserId(userId);
      
      res.json({
        success: true,
        data: wishlistItems,
        count: wishlistItems.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
  }

  static async addItem(req, res) {
    try {
      const userId = req.user.id;
      
      const validationErrors = Wishlist.validate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors.join(', ') });
      }

      // Check if item already exists in wishlist
      const existingItem = await WishlistDB.findByUserIdAndProductId(userId, req.body.product_id);
      if (existingItem) {
        return res.status(400).json({ error: 'Item already in wishlist' });
      }

      const wishlistData = { ...req.body, user_id: userId };
      const wishlistItem = await WishlistDB.create(wishlistData);
      
      res.status(201).json({
        success: true,
        data: wishlistItem,
        message: 'Item added to wishlist successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add item to wishlist' });
    }
  }

  static async removeItem(req, res) {
    try {
      const userId = req.user.id;
      const productId = req.params.productId;

      const existingItem = await WishlistDB.findByUserIdAndProductId(userId, productId);
      if (!existingItem) {
        return res.status(404).json({ error: 'Item not found in wishlist' });
      }

      await WishlistDB.delete(userId, productId);
      
      res.json({
        success: true,
        message: 'Item removed from wishlist successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove item from wishlist' });
    }
  }
}

module.exports = WishlistController;