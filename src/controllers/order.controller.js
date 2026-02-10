const Order = require('../models/Order');
const Cart = require('../models/Cart');
const CheckoutSession = require('../models/CheckoutSession');
const Address = require('../models/Address');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const Shipment = require('../models/Shipment');
const { notifyAdmins } = require('../services/notification.service');

const buildOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

const buildTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = 0;
  const shipping = 0;
  const total = subtotal + tax + shipping;
  return { subtotal, tax, shipping, total };
};

const hydrateOrderItems = async (items) => {
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product_id);
    if (!product || product.status !== 'active') {
      throw new Error('Product not available');
    }

    let variant = null;
    if (item.variant_id) {
      variant = await Variant.findById(item.variant_id);
      if (!variant || !variant.is_active) {
        throw new Error('Variant not available');
      }
      if (variant.stock < item.qty) {
        throw new Error('Insufficient stock');
      }
    }

    const price = item.price || (variant && variant.price) || product.price;
    orderItems.push({
      product_id: product._id,
      variant_id: variant ? variant._id : null,
      name: product.name,
      qty: item.qty,
      price,
      total: price * item.qty
    });
  }

  return orderItems;
};

const createOrder = async (req, res) => {
  try {
    console.log('[ORDER] Create order request:', {
      userId: req.user?.id,
      body: req.body,
      headers: { authorization: req.headers.authorization ? 'present' : 'missing' }
    });

    const userId = req.user.id;
    const { mode = 'cart', addressId, paymentMethod, notes, sessionId } = req.body;

    if (!addressId || !paymentMethod) {
      console.log('[ORDER] Validation failed - missing fields:', { addressId, paymentMethod });
      return res.status(400).json({
        message: 'Address and payment method are required',
        missing: {
          addressId: !addressId,
          paymentMethod: !paymentMethod
        }
      });
    }

    const VALID_PAYMENT_METHODS = ['COD', 'PayU', 'Stripe'];
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      console.log('[ORDER] Invalid payment method:', paymentMethod);
      return res.status(400).json({ message: `Invalid payment method. Supported: ${VALID_PAYMENT_METHODS.join(', ')}` });
    }

    const address = await Address.findOne({ _id: addressId, user_id: userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    let sourceItems = [];
    let session = null;

    if (mode === 'buyNow') {
      const query = {
        user_id: userId,
        status: 'active',
        expires_at: { $gt: new Date() }
      };
      if (sessionId) query._id = sessionId;

      session = await CheckoutSession.findOne(query);
      if (!session) {
        return res.status(404).json({ message: 'Buy now session not found' });
      }

      sourceItems = session.items;
    } else {
      const cart = await Cart.findOne({ user_id: userId });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }
      sourceItems = cart.items;
    }

    const orderItems = await hydrateOrderItems(sourceItems);
    const totals = buildTotals(orderItems);

    const order = await Order.create({
      user_id: userId,
      order_number: buildOrderNumber(),
      items: orderItems,
      address_id: addressId,
      ...totals,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'COD' ? 'pending' : 'awaiting_payment',
      notes: notes || '',
      status_history: [{ status: 'pending', at: new Date() }]
    });

    // Send notification to admins about new order (non-blocking)
    notifyAdmins(
      '🛍️ New Order Received',
      `Order #${order.order_number} - ${order.subtotal.toFixed(2)} - ${orderItems.length} items`,
      {
        orderId: order._id.toString(),
        orderNumber: order.order_number,
        userId: userId,
        amount: order.total,
        itemCount: orderItems.length
      }
    ).catch(error => {
      console.error('Failed to send admin notification:', error);
      // Don't fail order creation if notification fails
    });

    for (const item of orderItems) {
      if (item.variant_id) {
        await Variant.updateOne(
          { _id: item.variant_id, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } }
        );
      }
    }

    if (mode === 'buyNow' && session) {
      session.status = 'completed';
      await session.save();
    } else {
      await Cart.updateOne({ user_id: userId }, { items: [] });
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('[ORDER] Error creating order:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      body: req.body
    });

    if (error.message === 'Product not available' || error.message === 'Variant not available') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Insufficient stock') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

const listOrders = async (req, res) => {
  try {
    console.log('[ORDER] List orders request:', {
      userId: req.user?.id,
      query: req.query
    });

    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user_id: userId };
    if (status) filter.status = status;

    const safeLimit = Math.min(Number(limit) || 10, 50);
    const safePage = Math.max(Number(page) || 1, 1);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    const total = await Order.countDocuments(filter);

    console.log('[ORDER] Found orders:', { count: orders.length, total });

    res.json({
      success: true,
      data: orders,
      pagination: {
        current_page: safePage,
        total_pages: Math.ceil(total / safeLimit),
        total_items: total
      }
    });
  } catch (error) {
    console.error('[ORDER] Error listing orders:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.orderId, user_id: userId })
      .populate('address_id')
      .populate('items.product_id')
      .populate('items.variant_id');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.orderId, user_id: userId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    order.status = 'cancelled';
    order.status_history.push({ status: 'cancelled', at: new Date() });
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

const trackOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.orderId, user_id: userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const shipment = await Shipment.findOne({ order_id: order._id });
    res.json({ success: true, data: { order, shipment } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tracking' });
  }
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  cancelOrder,
  trackOrder
};
