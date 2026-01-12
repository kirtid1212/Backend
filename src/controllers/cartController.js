const Cart = require('../models/Cart');
const CartDB = require('../utils/cartDB');

class CartController {
  static async getCart(req, res) {
    try {
      const userId = req.user.id;
      const cartItems = await CartDB.findByUserId(userId);
      
      res.json({
        success: true,
        data: cartItems,
        count: cartItems.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  }

  static async addToCart(req, res) {
    try {
      const userId = req.user.id;
      
      const validationErrors = Cart.validate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors.join(', ') });
      }

      // Check if item already exists in cart
      const existingItem = await CartDB.findByUserIdAndProductId(userId, req.body.product_id);
      
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + req.body.quantity;
        if (newQuantity > 10) {
          return res.status(400).json({ error: 'Maximum quantity per item is 10' });
        }
        
        const updatedItem = await CartDB.update(existingItem.id, { quantity: newQuantity });
        return res.json({
          success: true,
          data: updatedItem,
          message: 'Cart updated successfully'
        });
      }

      const cartData = { ...req.body, user_id: userId };
      const cartItem = await CartDB.create(cartData);
      
      res.status(201).json({
        success: true,
        data: cartItem,
        message: 'Item added to cart successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  }

  static async updateCartItem(req, res) {
    try {
      const userId = req.user.id;
      const itemId = req.params.itemId;

      const existingItem = await CartDB.findByUserIdAndItemId(userId, itemId);
      if (!existingItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      const validationErrors = Cart.validate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors.join(', ') });
      }

      const updatedItem = await CartDB.update(itemId, req.body);
      
      res.json({
        success: true,
        data: updatedItem,
        message: 'Cart item updated successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  }

  static async removeItem(req, res) {
    try {
      const userId = req.user.id;
      const itemId = req.params.itemId;

      const existingItem = await CartDB.findByUserIdAndItemId(userId, itemId);
      if (!existingItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      await CartDB.delete(itemId);
      
      res.json({
        success: true,
        message: 'Item removed from cart successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  }

  static async clearCart(req, res) {
    try {
      const userId = req.user.id;
      await CartDB.clearByUserId(userId);
      
      res.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  }
}

module.exports = CartController;