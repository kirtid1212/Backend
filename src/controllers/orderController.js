const Order = require('../models/Order');

class OrderController {
  static async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { items, address_id, subtotal, tax = 0, shipping = 0 } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Order items are required' });
      }

      const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const total = subtotal + tax + shipping;

      const order = new Order({
        user_id: userId,
        order_number: orderNumber,
        items,
        address_id,
        subtotal,
        tax,
        shipping,
        total
      });

      await order.save();
      await order.populate(['items.product_id', 'address_id']);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  }

  static async getAllOrders(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;
      
      const filter = { user_id: userId };
      if (status) filter.status = status;

      const orders = await Order.find(filter)
        .populate(['items.product_id', 'address_id'])
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Order.countDocuments(filter);

      res.json({
        success: true,
        data: orders,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  static async getOrderById(req, res) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;

      const order = await Order.findOne({ _id: orderId, user_id: userId })
        .populate(['items.product_id', 'address_id']);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  static async cancelOrder(req, res) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;

      const order = await Order.findOne({ _id: orderId, user_id: userId });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'cancelled') {
        return res.status(400).json({ error: 'Order already cancelled' });
      }

      if (order.status === 'shipped' || order.status === 'delivered') {
        return res.status(400).json({ error: 'Cannot cancel shipped/delivered order' });
      }

      order.status = 'cancelled';
      await order.save();

      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  }

  static async getOrderInvoice(req, res) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;

      const order = await Order.findOne({ _id: orderId, user_id: userId })
        .populate(['items.product_id', 'address_id']);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const invoice = {
        invoice_number: `INV-${order.order_number}`,
        order_number: order.order_number,
        date: order.createdAt,
        customer: { user_id: order.user_id },
        address: order.address_id,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        status: order.status,
        payment_status: order.payment_status
      };

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }
}

module.exports = OrderController;