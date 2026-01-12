const { v4: uuidv4 } = require('uuid');

class WishlistDB {
  static wishlists = [];

  static async findByUserId(userId) {
    return this.wishlists.filter(item => item.user_id === userId);
  }

  static async findByUserIdAndProductId(userId, productId) {
    return this.wishlists.find(item => item.user_id === userId && item.product_id === productId);
  }

  static async create(wishlistData) {
    const wishlistItem = {
      id: uuidv4(),
      ...wishlistData,
      created_at: new Date().toISOString()
    };
    
    this.wishlists.push(wishlistItem);
    return wishlistItem;
  }

  static async delete(userId, productId) {
    const index = this.wishlists.findIndex(item => 
      item.user_id === userId && item.product_id === productId
    );
    if (index !== -1) {
      this.wishlists.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = WishlistDB;