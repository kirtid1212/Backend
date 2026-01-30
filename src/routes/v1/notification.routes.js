const express = require('express');

const {
  registerDevice,
  unregisterDevice,
  getUserDevices,
  sendTestNotification,
  sendToDevice,
  sendToUser,
  sendToUsers,
  sendBroadcast,
  getStats,
  sendPaymentSuccessNotification,
  sendOrderDeliveredNotification,
} = require('../../controllers/notification.controller');

const { authenticate, requireAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

/* =========================================================
   DEVICE REGISTRATION ROUTES (AUTHENTICATED)
   ========================================================= */
router.post('/register-device', authenticate, registerDevice);
router.post('/unregister-device', authenticate, unregisterDevice);
router.get('/devices', authenticate, getUserDevices);

/* =========================================================
   TEST NOTIFICATION (AUTHENTICATED)
   ========================================================= */
router.post('/test', authenticate, sendTestNotification);

/* =========================================================
   ADMIN ROUTES
   ========================================================= */
router.post('/send-to-device', authenticate, requireAdmin, sendToDevice);
router.post('/send-to-user', authenticate, requireAdmin, sendToUser);
router.post('/send-to-users', authenticate, requireAdmin, sendToUsers);
router.post('/broadcast', authenticate, requireAdmin, sendBroadcast);
router.get('/stats', authenticate, requireAdmin, getStats);

/* =========================================================
   PAYMENT SUCCESS NOTIFICATION
   ========================================================= */
/**
 * POST /api/notifications/payment-success
 * Body: { orderId, userId }
 */
router.post('/payment-success', authenticate, async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, userId',
      });
    }

    await sendPaymentSuccessNotification(orderId, userId);

    res.status(200).json({
      success: true,
      message: 'Payment success notification sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending payment success notification',
      error: error.message,
    });
  }
});

/* =========================================================
   ORDER DELIVERED NOTIFICATION
   ========================================================= */
/**
 * POST /api/notifications/order-delivered
 * Body: { orderId, userId }
 */
router.post('/order-delivered', authenticate, async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, userId',
      });
    }

    await sendOrderDeliveredNotification(orderId, userId);

    res.status(200).json({
      success: true,
      message: 'Order delivered notification sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending order delivered notification',
      error: error.message,
    });
  }
});

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
// } = require('../../controllers/notification.controller');
// const { authenticate, requireAdmin } = require('../../middleware/auth.middleware');

// const router = express.Router();

// // Device Registration Routes (authenticated)
// router.post('/register-device', authenticate, registerDevice);
// router.post('/unregister-device', authenticate, unregisterDevice);
// router.get('/devices', authenticate, getUserDevices);

// // Test Notification (authenticated)
// router.post('/test', authenticate, sendTestNotification);

// // Admin Routes
// router.post('/send-to-device', authenticate, requireAdmin, sendToDevice);
// router.post('/send-to-user', authenticate, requireAdmin, sendToUser);
// router.post('/send-to-users', authenticate, requireAdmin, sendToUsers);
// router.post('/broadcast', authenticate, requireAdmin, sendBroadcast);
// router.get('/stats', authenticate, requireAdmin, getStats);



// /* =========================================================
//    PAYMENT SUCCESS AND ORDER PLACED NOTIFICATION
//    ========================================================= */
// /**
//  * POST /api/notifications/payment-success
//  * Body: { orderId, userId }
//  */
// router.post("/payment-success", async (req, res) => {
//   try {
//     const { orderId, userId } = req.body;

//     if (!orderId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: orderId, userId",
//       });
//     }

//     await notificationController.sendPaymentSuccessNotification(orderId, userId);

//     res.status(200).json({
//       success: true,
//       message: "Payment success notification sent successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error sending payment success notification",
//       error: error.message,
//     });
//   }
// });

// /**
//  * POST /api/notifications/order-delivered
//  * Body: { orderId, userId }
//  */
// router.post("/order-delivered", async (req, res) => {
//   try {
//     const { orderId, userId } = req.body;

//     if (!orderId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: orderId, userId",
//       });
//     }

//     await notificationController.sendOrderDeliveredNotification(orderId, userId);

//     res.status(200).json({
//       success: true,
//       message: "Order delivered notification sent successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error sending order delivered notification",
//       error: error.message,
//     });
//   }
// });




















// module.exports = router;
