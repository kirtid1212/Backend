const CheckoutSession = require('../models/CheckoutSession');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Variant = require('../models/Variant');

const SESSION_TTL_MS = 30 * 60 * 1000;

const buildTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = 0;
  const shipping = 0;
  const total = subtotal + tax + shipping;
  return { subtotal, tax, shipping, total };
};

const createBuyNow = async (req, res) => {
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

    await CheckoutSession.updateMany({ user_id: userId, status: 'active' }, { status: 'expired' });

    const items = [{
      product_id: productId,
      variant_id: variantId || null,
      qty: quantity,
      price
    }];

    const totals = buildTotals(items);

    const session = await CheckoutSession.create({
      user_id: userId,
      items,
      ...totals,
      mode: 'buyNow',
      status: 'active',
      expires_at: new Date(Date.now() + SESSION_TTL_MS)
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create buy now session' });
  }
};

const getSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await CheckoutSession.findOne({
      user_id: userId,
      status: 'active',
      expires_at: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({ message: 'No active session' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch checkout session' });
  }
};

const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mode = 'cart', sessionId } = req.query;

    if (mode === 'buyNow') {
      const query = {
        user_id: userId,
        status: 'active',
        expires_at: { $gt: new Date() }
      };
      if (sessionId) query._id = sessionId;

      const session = await CheckoutSession.findOne(query);
      if (!session) {
        return res.status(404).json({ message: 'Buy now session not found' });
      }

      return res.json({ success: true, data: session });
    }

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totals = buildTotals(cart.items);
    res.json({ success: true, data: { items: cart.items, ...totals } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch checkout summary' });
  }
};

module.exports = {
  createBuyNow,
  getSession,
  getSummary
};
