/**
 * Notification Helper Service
 * 
 * This module provides convenience functions for common notification scenarios
 * in the e-commerce application. Use these functions instead of manually
 * calling the notification service for consistency and maintainability.
 */

const {
  sendNotificationToUser,
  sendNotificationToUsers
} = require('./notification.service');

/**
 * Send order confirmation notification
 * @param {string} userId - User ID
 * @param {object} order - Order object with orderId, amount, etc.
 */
const notifyOrderConfirmation = async (userId, order) => {
  return sendNotificationToUser(
    userId,
    '✅ Order Confirmed',
    `Your order #${order.orderId} for ₹${order.amount} has been confirmed`,
    {
      type: 'order',
      orderId: order.orderId,
      action: 'view_order',
      status: 'confirmed'
    }
  );
};

/**
 * Send order shipped notification
 * @param {string} userId - User ID
 * @param {object} order - Order object with orderId, tracking info
 */
const notifyOrderShipped = async (userId, order) => {
  return sendNotificationToUser(
    userId,
    '📦 Order Shipped',
    `Your order #${order.orderId} has been shipped`,
    {
      type: 'order',
      orderId: order.orderId,
      action: 'track_order',
      status: 'shipped',
      trackingNumber: order.trackingNumber
    }
  );
};

/**
 * Send order delivery notification
 * @param {string} userId - User ID
 * @param {object} order - Order object
 */
const notifyOrderDelivered = async (userId, order) => {
  return sendNotificationToUser(
    userId,
    '🎉 Order Delivered',
    `Your order #${order.orderId} has been delivered`,
    {
      type: 'order',
      orderId: order.orderId,
      action: 'view_order',
      status: 'delivered'
    }
  );
};

/**
 * Send order cancelled notification
 * @param {string} userId - User ID
 * @param {object} order - Order object with cancellation reason
 */
const notifyOrderCancelled = async (userId, order) => {
  return sendNotificationToUser(
    userId,
    '❌ Order Cancelled',
    `Your order #${order.orderId} has been cancelled. Refund will be processed within 5-7 business days`,
    {
      type: 'order',
      orderId: order.orderId,
      action: 'view_order',
      status: 'cancelled',
      reason: order.cancellationReason
    }
  );
};

/**
 * Send payment failure notification
 * @param {string} userId - User ID
 * @param {object} paymentInfo - Payment information
 */
const notifyPaymentFailed = async (userId, paymentInfo) => {
  return sendNotificationToUser(
    userId,
    '⚠️ Payment Failed',
    `Payment for order #${paymentInfo.orderId} failed. Please try again.`,
    {
      type: 'payment',
      orderId: paymentInfo.orderId,
      action: 'retry_payment',
      status: 'failed',
      reason: paymentInfo.failureReason
    }
  );
};

/**
 * Send flash sale notification
 * @param {array} userIds - Array of user IDs
 * @param {object} sale - Sale information
 */
const notifyFlashSale = async (userIds, sale) => {
  return sendNotificationToUsers(
    userIds,
    '🔥 Flash Sale!',
    `${sale.discount}% off on ${sale.category}. Limited time only!`,
    {
      type: 'promotion',
      promoId: sale.saleId,
      action: 'view_sale',
      discount: sale.discount,
      category: sale.category,
      expiresAt: sale.expiresAt
    }
  );
};

/**
 * Send new product launch notification
 * @param {array} userIds - Array of user IDs
 * @param {object} product - Product information
 */
const notifyNewProduct = async (userIds, product) => {
  return sendNotificationToUsers(
    userIds,
    '✨ New Arrival',
    `Check out ${product.name} - Now available in our store!`,
    {
      type: 'product',
      productId: product.productId,
      action: 'view_product',
      category: product.category
    }
  );
};

/**
 * Send price drop notification
 * @param {string} userId - User ID
 * @param {object} product - Product with new price
 */
const notifyPriceDrop = async (userId, product) => {
  return sendNotificationToUser(
    userId,
    '💰 Price Drop!',
    `${product.name} is now ₹${product.newPrice} (was ₹${product.oldPrice})`,
    {
      type: 'product',
      productId: product.productId,
      action: 'view_product',
      category: 'price_alert',
      oldPrice: product.oldPrice,
      newPrice: product.newPrice
    }
  );
};

/**
 * Send wishlist back in stock notification
 * @param {string} userId - User ID
 * @param {object} product - Product information
 */
const notifyBackInStock = async (userId, product) => {
  return sendNotificationToUser(
    userId,
    '📌 Back in Stock',
    `${product.name} is back in stock. Limited quantity available.`,
    {
      type: 'product',
      productId: product.productId,
      action: 'view_product',
      status: 'back_in_stock'
    }
  );
};

/**
 * Send review request notification
 * @param {string} userId - User ID
 * @param {object} order - Order information
 */
const notifyReviewRequest = async (userId, order) => {
  return sendNotificationToUser(
    userId,
    '⭐ Share Your Review',
    `How was your experience with order #${order.orderId}? Help others by leaving a review.`,
    {
      type: 'review',
      orderId: order.orderId,
      action: 'write_review'
    }
  );
};

/**
 * Send wallet credited notification
 * @param {string} userId - User ID
 * @param {object} walletInfo - Wallet information
 */
const notifyWalletCredited = async (userId, walletInfo) => {
  return sendNotificationToUser(
    userId,
    '💳 Wallet Credited',
    `₹${walletInfo.amount} has been added to your wallet`,
    {
      type: 'wallet',
      action: 'view_wallet',
      amount: walletInfo.amount,
      reason: walletInfo.reason
    }
  );
};

/**
 * Send coupon received notification
 * @param {string} userId - User ID
 * @param {object} coupon - Coupon information
 */
const notifyCouponReceived = async (userId, coupon) => {
  return sendNotificationToUser(
    userId,
    '🎁 Coupon Received',
    `${coupon.description}. Valid until ${coupon.expiryDate}`,
    {
      type: 'coupon',
      couponCode: coupon.code,
      action: 'view_coupons',
      discount: coupon.discount,
      expiryDate: coupon.expiryDate
    }
  );
};

/**
 * Send abandoned cart reminder
 * @param {string} userId - User ID
 * @param {object} cart - Cart information
 */
const notifyAbandonedCart = async (userId, cart) => {
  return sendNotificationToUser(
    userId,
    '🛒 Don\'t Forget Your Items',
    `You have items worth ₹${cart.total} in your cart. Complete checkout now.`,
    {
      type: 'cart',
      action: 'view_cart',
      total: cart.total,
      itemCount: cart.itemCount
    }
  );
};

/**
 * Send generic promotional notification
 * @param {array} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 */
const notifyPromotion = async (userIds, title, message, data = {}) => {
  return sendNotificationToUsers(
    userIds,
    title,
    message,
    {
      type: 'promotion',
      action: 'view_promotion',
      ...data
    }
  );
};

/**
 * Send account notification (verification, security, etc.)
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 */
const notifyAccount = async (userId, title, message, data = {}) => {
  return sendNotificationToUser(
    userId,
    title,
    message,
    {
      type: 'account',
      ...data
    }
  );
};

module.exports = {
  // Order notifications
  notifyOrderConfirmation,
  notifyOrderShipped,
  notifyOrderDelivered,
  notifyOrderCancelled,
  
  // Payment notifications
  notifyPaymentFailed,
  
  // Promotional notifications
  notifyFlashSale,
  notifyNewProduct,
  notifyPriceDrop,
  notifyBackInStock,
  notifyAbandonedCart,
  notifyPromotion,
  
  // User engagement notifications
  notifyReviewRequest,
  notifyWalletCredited,
  notifyCouponReceived,
  
  // Generic notifications
  notifyAccount
};
