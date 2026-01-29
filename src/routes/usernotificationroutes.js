const express = require("express");
const router = express.Router();
// const notificationController = require("../controllers/notificationController");

/* =========================================================
   PAYMENT SUCCESS AND ORDER PLACED NOTIFICATION
   ========================================================= */
/**
 * POST /api/notifications/payment-success
 * Body: { orderId, userId }
 */
router.post("/payment-success", async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: orderId, userId",
      });
    }

    await notificationController.sendPaymentSuccessNotification(orderId, userId);

    res.status(200).json({
      success: true,
      message: "Payment success notification sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending payment success notification",
      error: error.message,
    });
  }
});

/**
 * POST /api/notifications/order-delivered
 * Body: { orderId, userId }
 */
router.post("/order-delivered", async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: orderId, userId",
      });
    }

    await notificationController.sendOrderDeliveredNotification(orderId, userId);

    res.status(200).json({
      success: true,
      message: "Order delivered notification sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending order delivered notification",
      error: error.message,
    });
  }
});

module.exports = router;
