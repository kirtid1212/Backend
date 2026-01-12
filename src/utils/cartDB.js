const { v4: uuidv4 } = require('uuid');

class CartDB {
  static carts = [];

  static async findByUserId(userId) {
    return this.carts.filter(item => item.user_id === userId);
  }

  static async findByUserIdAndProductId(userId, productId) {
    return this.carts.find(item => item.user_id === userId && item.product_id === productId);
  }

  static async create(cartData) {
    const cartItem = {
      id: uuidv4(),
      ...cartData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.carts.push(cartItem);
    return cartItem;
  }

  static async update(itemId, updateData) {
    const index = this.carts.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.carts[index] = {
        ...this.carts[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      return this.carts[index];
    }
    return null;
  }

  static async delete(itemId) {
    const index = this.carts.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.carts.splice(index, 1);
      return true;
    }
    return false;
  }

  static async clearByUserId(userId) {
    this.carts = this.carts.filter(item => item.user_id !== userId);
    return true;
  }

  static async findByUserIdAndItemId(userId, itemId) {
    return this.carts.find(item => item.user_id === userId && item.id === itemId);
  }
}

module.exports = CartDB;