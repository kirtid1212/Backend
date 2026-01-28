const axios = require("axios");
const { getAccessToken } = require("../config/paypal.config");
const Transaction = require("../models/transaction.model");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  const token = await getAccessToken();

  const response = await axios.post(
    `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: req.body.amount,
          },
        },
      ],
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  res.json(response.data);
};

// CAPTURE PAYMENT
exports.captureOrder = async (req, res) => {
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
};
