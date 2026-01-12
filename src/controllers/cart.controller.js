const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Variant = require('../models/Variant');

const buildSummary = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    subtotal,
    item_count: items.reduce((sum, item) => sum + item.qty, 0)
  };
};

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user_id: userId })
      .populate('items.product_id')
      .populate('items.variant_id');

    if (!cart) {
      cart = await Cart.create({ user_id: userId, items: [] });
    }

    const summary = buildSummary(cart.items);
    res.json({ success: true, data: cart, summary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
};

const addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, qty } = req.body;

    if (!productId || !qty) {
      return res.status(400).json({ message: 'Product and qty are required' });
    }

    const quantity = Number(qty);
    if (Number.isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Invalid qty' });
    }

    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let variant = null;
    let price = product.price;

    if (variantId) {
      variant = await Variant.findOne({ _id: variantId, product_id: productId, is_active: true });
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }
      price = variant.price > 0 ? variant.price : product.price;
      if (variant.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    }

    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      cart = await Cart.create({ user_id: userId, items: [] });
    }

    const existing = cart.items.find((item) => {
      const sameProduct = item.product_id.toString() === productId;
      const sameVariant = variantId
        ? item.variant_id && item.variant_id.toString() === variantId
        : !item.variant_id;
      return sameProduct && sameVariant;
    });

    if (existing) {
      const newQty = existing.qty + quantity;
      if (variant && variant.stock < newQty) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      existing.qty = newQty;
      existing.price = price;
    } else {
      cart.items.push({
        product_id: productId,
        variant_id: variantId || null,
        qty: quantity,
        price
      });
    }

    await cart.save();
    cart = await Cart.findOne({ user_id: userId })
      .populate('items.product_id')
      .populate('items.variant_id');

    const summary = buildSummary(cart.items);
    res.status(201).json({ success: true, data: cart, summary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
};

const updateItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { qty } = req.body;
    const itemId = req.params.itemId;

    const quantity = Number(qty);
    if (Number.isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Invalid qty' });
    }

    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (item.variant_id) {
      const variant = await Variant.findById(item.variant_id);
      if (!variant || variant.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    }

    item.qty = quantity;
    await cart.save();

    cart = await Cart.findOne({ user_id: userId })
      .populate('items.product_id')
      .populate('items.variant_id');

    const summary = buildSummary(cart.items);
    res.json({ success: true, data: cart, summary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update cart item' });
  }
};

const removeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    item.deleteOne();
    await cart.save();

    const updated = await Cart.findOne({ user_id: userId })
      .populate('items.product_id')
      .populate('items.variant_id');

    const summary = buildSummary(updated.items);
    res.json({ success: true, data: updated, summary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove cart item' });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear cart' });
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
};
