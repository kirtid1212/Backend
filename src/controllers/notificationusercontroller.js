const admin = require("../config/firebase");

/* =========================================================
   SEND PAYMENT SUCCESS AND ORDER PLACED NOTIFICATION (FCM only)
   ========================================================= */
const sendPaymentSuccessNotification = async (orderId, userId) => {
  try {
    const title = "Payment Successful";
    const body = "Payment done successfully and order placed";

    // Note: FCM tokens need to be provided or fetched from another source
    // For now, assuming tokens are passed or hardcoded for demo
    const tokens = []; // Replace with actual token fetching logic if needed

    if (tokens.length === 0) {
      console.log("⚠️ No FCM tokens found");
      return;
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        type: "payment_success",
        orderId,
        userId,
      },
    });

    console.log("🔔 Payment success notification sent:", response.successCount);
  } catch (error) {
    console.error("❌ Error sending payment success notification:", error);
    throw error;
  }
};

/* =========================================================
   SEND ORDER DELIVERED NOTIFICATION (FCM only)
   ========================================================= */
const sendOrderDeliveredNotification = async (orderId, userId) => {
  try {
    const title = "Order Delivered";
    const body = "Your order has been successfully delivered";

    // Note: FCM tokens need to be provided or fetched from another source
    // For now, assuming tokens are passed or hardcoded for demo
    const tokens = []; // Replace with actual token fetching logic if needed

    if (tokens.length === 0) {
      console.log("⚠️ No FCM tokens found");
      return;
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        type: "order_delivered",
        orderId,
        userId,
      },
    });

    console.log("🔔 Order delivered notification sent:", response.successCount);
  } catch (error) {
    console.error("❌ Error sending order delivered notification:", error);
    throw error;
  }
};

module.exports = {
  sendPaymentSuccessNotification,
  sendOrderDeliveredNotification,
};
