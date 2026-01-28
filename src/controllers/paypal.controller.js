const axios = require("axios");
const { getAccessToken } = require("../config/paypal.config");
const Transaction = require("../models/transaction.model");

// CREATE ORDER
exports.createOrder = async (req, res) => {
try{
    const token = await getAccessToken();

  const amount = req.body.amount;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  const formattedAmount = Number(amount).toFixed(2);

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
   const token = await getAccessToken();

  const response = await axios.post(
    `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${req.params.orderId}/capture`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const capture = response.data.purchase_units[0].payments.captures[0];

  await Transaction.create({
    orderId: req.params.orderId,
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
