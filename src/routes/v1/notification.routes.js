const express = require('express');

const {
  sendTestNotification,
  paymentSuccessNotification,
  orderDeliveredNotification
} = require('../../controllers/notification.controller');

const { authenticate, requireAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

/* =========================================================
   TEST NOTIFICATION (AUTHENTICATED)
   ========================================================= */
router.post('/test', authenticate, sendTestNotification);

/* =========================================================
   ✅ PRODUCTION READY APIs (USER + ADMIN FLOW)
   ========================================================= */

/**
 * POST /api/v1/notifications/payment-success-v2
 * Triggered after successful payment
 * → Notifies USER + ADMIN
 */
router.post(
  '/payment-success-v2',
  authenticate,
  paymentSuccessNotification
);

/**
 * POST /api/v1/notifications/order-delivered-v2
 * Admin marks order as delivered
 * → Notifies USER
 */
router.post(
  '/order-delivered-v2',
  authenticate,
  requireAdmin,
  orderDeliveredNotification
);

module.exports = router;






























// const express = require('express');

// const {
//   registerDevice,
//   unregisterDevice,
//   getUserDevices,
//   sendTestNotification,
//   sendToDevice,
//   sendToUser,
//   sendToUsers,
//   sendBroadcast,
//   getStats,
//   sendPaymentSuccessNotification,
//   sendOrderDeliveredNotification,
// } = require('../../controllers/notification.controller');

// const { authenticate, requireAdmin } = require('../../middleware/auth.middleware');

// const router = express.Router();

// /* =========================================================
//    DEVICE REGISTRATION ROUTES (AUTHENTICATED)
//    ========================================================= */
// router.post('/register-device', authenticate, registerDevice);
// router.post('/unregister-device', authenticate, unregisterDevice);
// router.get('/devices', authenticate, getUserDevices);

// /* =========================================================
//    TEST NOTIFICATION (AUTHENTICATED)
//    ========================================================= */
// router.post('/test', authenticate, sendTestNotification);

// /* =========================================================
//    ADMIN ROUTES
//    ========================================================= */
// router.post('/send-to-device', authenticate, requireAdmin, sendToDevice);
// router.post('/send-to-user', authenticate, requireAdmin, sendToUser);
// router.post('/send-to-users', authenticate, requireAdmin, sendToUsers);
// router.post('/broadcast', authenticate, requireAdmin, sendBroadcast);
// router.get('/stats', authenticate, requireAdmin, getStats);

// /* =========================================================
//    PAYMENT SUCCESS NOTIFICATION
//    ========================================================= */
// /**
//  * POST /api/notifications/payment-success
//  * Body: { orderId, userId }
//  */
// router.post('/payment-success', authenticate, async (req, res) => {
//   try {
//     const { orderId, userId } = req.body;

//     if (!orderId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: orderId, userId',
//       });
//     }

//     await sendPaymentSuccessNotification(orderId, userId);

//     res.status(200).json({
//       success: true,
//       message: 'Payment success notification sent successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error sending payment success notification',
//       error: error.message,
//     });
//   }
// });

// /* =========================================================
//    ORDER DELIVERED NOTIFICATION
//    ========================================================= */
// /**
//  * POST /api/notifications/order-delivered
//  * Body: { orderId, userId }
//  */
// router.post('/order-delivered', authenticate, async (req, res) => {
//   try {
//     const { orderId, userId } = req.body;

//     if (!orderId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: orderId, userId',
//       });
//     }

//     await sendOrderDeliveredNotification(orderId, userId);

//     res.status(200).json({
//       success: true,
//       message: 'Order delivered notification sent successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error sending order delivered notification',
//       error: error.message,
//     });
//   }
// });

// module.exports = router;