const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Shipment = require('../../models/Shipment');
const User = require('../../models/User');
const { createNotification } = require('./notification.controller');

const listOrders = async (req, res) => {
  try {
    const { status, phone, orderId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (orderId) {
      if (mongoose.isValidObjectId(orderId)) {
        filter._id = orderId;
      } else {
        filter.order_number = orderId;
      }
    }

    if (phone) {
      const user = await User.findOne({ phone });
      if (!user) {
        return res.json({ success: true, data: [], pagination: { current_page: 1, total_pages: 0, total_items: 0 } });
      }
      filter.user_id = user._id;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const safeLimit = Math.min(Number(limit) || 20, 50);
    const safePage = Math.max(Number(page) || 1, 1);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    const total = await Order.countDocuments(filter);

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
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user_id', 'name phone role')
      .populate('address_id')
      .populate('items.product_id')
      .populate('items.variant_id')
      .populate('shipment_id');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['processing', 'shipped', 'delivered', 'cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.orderId).populate('user_id', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    order.status = status;
    order.status_history.push({ status, at: new Date() });

    // Update payment status if order is processing or delivered
    if (status === 'processing' && order.payment_status === 'pending') {
      order.payment_status = 'paid';
    }

    await order.save();

    // Trigger notifications based on status change
    try {
      // PAYMENT_SUCCESS notification
      if (status === 'processing' && previousStatus === 'pending') {
        await createNotification({
          title: '💳 Payment Successful',
          message: `Payment of ₹${order.total} received for order ${order.order_number}`,
          type: 'PAYMENT_SUCCESS',
          orderId: order._id,
          userId: order.user_id._id,
          metadata: {
            orderNumber: order.order_number,
            amount: order.total,
            userName: order.user_id.name || 'Customer'
          }
        });
      }

      // DELIVERY_SUCCESS notification
      if (status === 'delivered') {
        await createNotification({
          title: '📦 Order Delivered',
          message: `Order ${order.order_number} has been delivered successfully`,
          type: 'DELIVERY_SUCCESS',
          orderId: order._id,
          userId: order.user_id._id,
          metadata: {
            orderNumber: order.order_number,
            amount: order.total,
            userName: order.user_id.name || 'Customer'
          }
        });
      }
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the status update if notification fails
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status' });
  }
};


const updateShipment = async (req, res) => {
  try {
    const { carrier, trackingId, shippedAt } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let shipment = null;
    if (order.shipment_id) {
      shipment = await Shipment.findById(order.shipment_id);
    }

    if (!shipment) {
      shipment = await Shipment.create({
        order_id: order._id,
        carrier: carrier || '',
        tracking_id: trackingId || '',
        shipped_at: shippedAt ? new Date(shippedAt) : null,
        status: shippedAt ? 'in_transit' : 'created'
      });
      order.shipment_id = shipment._id;
      await order.save();
    } else {
      if (carrier !== undefined) shipment.carrier = carrier;
      if (trackingId !== undefined) shipment.tracking_id = trackingId;
      if (shippedAt !== undefined) {
        shipment.shipped_at = shippedAt ? new Date(shippedAt) : null;
        shipment.status = shippedAt ? 'in_transit' : shipment.status;
      }
      await shipment.save();
    }

    res.json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update shipment' });
  }
};

const refundOrder = async (req, res) => {
  res.status(501).json({ message: 'Refunds are not implemented yet' });
};

module.exports = {
  listOrders,
  getOrder,
  updateOrderStatus,
  updateShipment,
  refundOrder
};
