/**
 * INTEGRATION EXAMPLE
 * 
 * This file shows how to integrate notifications into your existing controllers.
 * Copy and adapt these examples to your order, payment, and other controllers.
 */

// ============================================================================
// Example 1: Send notification when order is created
// ============================================================================

// In order.controller.js or checkout.controller.js

const { notifyOrderConfirmation } = require('../services/notification.helper');

exports.createOrder = async (req, res) => {
  try {
    // ... your existing order creation logic ...
    
    const newOrder = await Order.create({
      userId: req.user._id,
      items: req.body.items,
      total: req.body.total,
      status: 'confirmed'
      // ... other order fields ...
    });

    // Send confirmation notification
    await notifyOrderConfirmation(req.user._id, {
      orderId: newOrder._id,
      amount: newOrder.total
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// ============================================================================
// Example 2: Send notification when order status changes
// ============================================================================

const { 
  notifyOrderShipped, 
  notifyOrderDelivered,
  notifyOrderCancelled 
} = require('../services/notification.helper');

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    // Send appropriate notification based on status
    if (status === 'shipped') {
      await notifyOrderShipped(order.userId, {
        orderId: order._id,
        trackingNumber
      });
    } else if (status === 'delivered') {
      await notifyOrderDelivered(order.userId, {
        orderId: order._id
      });
    } else if (status === 'cancelled') {
      await notifyOrderCancelled(order.userId, {
        orderId: order._id,
        cancellationReason: req.body.reason
      });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// ============================================================================
// Example 3: Send payment failure notification
// ============================================================================

const { notifyPaymentFailed } = require('../services/notification.helper');

exports.handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    // ... your payment failure handling logic ...

    // Send notification to user
    await notifyPaymentFailed(req.user._id, {
      orderId,
      failureReason: reason
    });

    res.status(200).json({ message: 'Payment failure handled' });
  } catch (error) {
    console.error('Error handling payment failure:', error);
    res.status(500).json({ error: 'Failed to handle payment failure' });
  }
};

// ============================================================================
// Example 4: Broadcast flash sale to all users
// ============================================================================

const { notifyFlashSale } = require('../services/notification.helper');

exports.createFlashSale = async (req, res) => {
  try {
    const { category, discount, duration } = req.body;

    const sale = await Sale.create({
      category,
      discount,
      expiresAt: new Date(Date.now() + duration * 60000) // duration in minutes
    });

    // Get all active user IDs
    const User = require('../models/user.model');
    const users = await User.find({ status: 'active' }, '_id');
    const userIds = users.map(u => u._id);

    // Send notification to all users
    if (userIds.length > 0) {
      await notifyFlashSale(userIds, {
        saleId: sale._id,
        category: sale.category,
        discount: sale.discount,
        expiresAt: sale.expiresAt
      });
    }

    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating flash sale:', error);
    res.status(500).json({ error: 'Failed to create flash sale' });
  }
};

// ============================================================================
// Example 5: Notify when product is back in stock
// ============================================================================

const { notifyBackInStock } = require('../services/notification.helper');

exports.updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { newStock } = req.body;

    const product = await Product.findById(productId);
    const wasOutOfStock = product.stock === 0;

    product.stock = newStock;
    await product.save();

    // If product just came back in stock, notify wishlist subscribers
    if (wasOutOfStock && newStock > 0) {
      // Find users who wishlisted this product
      const Wishlist = require('../models/wishlist.model');
      const wishlists = await Wishlist.find({ productId });
      
      for (const wishlist of wishlists) {
        await notifyBackInStock(wishlist.userId, {
          productId: product._id,
          name: product.name
        });
      }
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

// ============================================================================
// Example 6: Request review after delivery
// ============================================================================

const { notifyReviewRequest } = require('../services/notification.helper');

exports.requestReview = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    // Only request review if order is delivered and not already reviewed
    if (order.status === 'delivered' && !order.reviewed) {
      await notifyReviewRequest(order.userId, {
        orderId: order._id
      });

      order.reviewRequested = true;
      order.reviewRequestedAt = new Date();
      await order.save();
    }

    res.status(200).json({ message: 'Review request sent' });
  } catch (error) {
    console.error('Error requesting review:', error);
    res.status(500).json({ error: 'Failed to request review' });
  }
};

// ============================================================================
// Example 7: Notify when user receives wallet credit
// ============================================================================

const { notifyWalletCredited } = require('../services/notification.helper');

exports.creditWallet = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    const wallet = await Wallet.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true }
    );

    // Notify user of wallet credit
    await notifyWalletCredited(userId, {
      amount,
      reason
    });

    res.status(200).json(wallet);
  } catch (error) {
    console.error('Error crediting wallet:', error);
    res.status(500).json({ error: 'Failed to credit wallet' });
  }
};

// ============================================================================
// Example 8: Notify about abandoned cart
// ============================================================================

const { notifyAbandonedCart } = require('../services/notification.helper');

// Run this as a scheduled job (e.g., every 6 hours)
exports.sendAbandonedCartReminders = async (req, res) => {
  try {
    const Cart = require('../models/cart.model');
    
    // Find carts abandoned for more than 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const abandonedCarts = await Cart.find({
      createdAt: { $lt: sixHoursAgo },
      notified: false,
      items: { $ne: [] }
    });

    let notificationsSent = 0;

    for (const cart of abandonedCarts) {
      try {
        await notifyAbandonedCart(cart.userId, {
          total: cart.total,
          itemCount: cart.items.length
        });

        cart.notified = true;
        await cart.save();
        notificationsSent++;
      } catch (error) {
        console.error(`Failed to send cart reminder for user ${cart.userId}:`, error);
      }
    }

    res.status(200).json({ 
      message: `Sent ${notificationsSent} abandoned cart reminders`
    });
  } catch (error) {
    console.error('Error sending abandoned cart reminders:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
};

// ============================================================================
// Example 9: Send coupon to specific users or broadcast
// ============================================================================

const { notifyCouponReceived, notifyPromotion } = require('../services/notification.helper');

exports.distributeCoupon = async (req, res) => {
  try {
    const { couponId, userIds, targetCategory } = req.body;

    const coupon = await Coupon.findById(couponId);

    let targetUsers;
    if (userIds && userIds.length > 0) {
      // Send to specific users
      targetUsers = userIds;
    } else if (targetCategory) {
      // Send to users who purchased from this category
      const purchases = await Order.distinct('userId', {
        'items.category': targetCategory
      });
      targetUsers = purchases;
    } else {
      // Broadcast to all active users
      const User = require('../models/user.model');
      const users = await User.find({ status: 'active' }, '_id');
      targetUsers = users.map(u => u._id);
    }

    // Send notifications
    for (const userId of targetUsers) {
      await notifyCouponReceived(userId, {
        code: coupon.code,
        description: coupon.description,
        discount: coupon.discount,
        expiryDate: coupon.expiryDate
      });
    }

    res.status(200).json({ 
      message: `Coupon sent to ${targetUsers.length} users`
    });
  } catch (error) {
    console.error('Error distributing coupon:', error);
    res.status(500).json({ error: 'Failed to distribute coupon' });
  }
};

// ============================================================================
// Example 10: Schedule notifications with cron
// ============================================================================

// In a separate file or at app startup:

// const cron = require('node-cron');
// const notificationHelper = require('../services/notification.helper');

// // Send abandoned cart reminders every 6 hours
// cron.schedule('0 */6 * * *', async () => {
//   console.log('Running abandoned cart reminder job...');
//   try {
//     await notificationController.sendAbandonedCartReminders({}, {
//       status: () => ({ json: () => {} })
//     });
//   } catch (error) {
//     console.error('Cron job failed:', error);
//   }
// });

// // Send daily deals at 9 AM
// cron.schedule('0 9 * * *', async () => {
//   console.log('Sending daily deals notification...');
//   const User = require('../models/user.model');
//   const users = await User.find({ status: 'active' }, '_id');
//   const userIds = users.map(u => u._id);
//   
//   await notificationHelper.notifyPromotion(
//     userIds,
//     '🌅 Daily Deal Alert',
//     'Check out today\'s special offers!',
//     { action: 'view_deals', link: '/daily-deals' }
//   );
// });

module.exports = {
  // ... other exports
};
