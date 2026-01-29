const axios = require("axios");
const { getAccessToken } = require("../config/paypal.config");
const Transaction = require("../models/transaction.model");

// CREATE ORDER
exports.createOrder = async (req, res) => {
try{
    const token = await getAccessToken();

  const { amount } = req.body;

  if (!amount || amount === '' || amount === null || amount === undefined) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a valid positive number' });
  }

  const formattedAmount = numericAmount.toFixed(2);

  const response = await axios.post(
    `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: formattedAmount,
          },
        },
      ],
    },
    {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    }
  );

  res.json(response.data);
  }catch (error) {
      console.error(
        "PayPal Create Order Error:",
        error.response?.data || error
      );

      res.status(500).json({
        error: "Failed to create PayPal order",
      });
    }
};

// CAPTURE PAYMENT
exports.captureOrder = async (req, res) => {
 try{
   const { orderId } = req.params;
   
   if (!orderId || orderId.trim() === '') {
     return res.status(400).json({ error: 'Order ID is required' });
   }

   const token = await getAccessToken();

  const response = await axios.post(
    `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const capture = response.data?.purchase_units?.[0]?.payments?.captures?.[0];
  
  if (!capture) {
    return res.status(400).json({ error: 'Invalid PayPal response structure' });
  }

  await Transaction.create({
    orderId: orderId,
    transactionId: capture.id,
    amount: capture.amount.value,
    currency: capture.amount.currency_code,
    status: capture.status,
    paymentMethod: "PAYPAL",
  });

  res.json(response.data);
 }catch (error) {
    console.error(
      "PayPal Capture Error:",
      error.response?.data || error
    );

    res.status(500).json({
      error: "Failed to capture PayPal order",
    });
  }
};
