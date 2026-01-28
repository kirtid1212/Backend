require('dotenv').config();
const axios = require('axios');

const generateAccessToken = async () => {
    try {
        const baseURL = process.env.PAYPAL_BASE_URL;

        const auth = Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
        ).toString("base64");

        const response = await axios.post(
            `${baseURL}/v1/oauth2/token`,
            'grant_type=client_credentials',
            {
                timeout: 10000,
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return response.data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error.response?.data || error.message);
        throw new Error("Could not generate access token");
    }
};


const createOrder = async (total) => {
    try {
        if (!total || Number(total) <= 0) {
        throw new Error('Invalid order amount');
        }

    const accessToken = await generateAccessToken();

    const response = await axios.post(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "INR",
                        value: Number(total).toFixed(2),
                    },
                },
            ],
        },
        {
            timeout: 10000,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
}catch (error) {
    console.error(
      '❌ PayPal Create Order Error:',
      error.response?.data || error.message
    );
    throw new Error('Failed to create PayPal order');
  }
};


const captureOrder = async (orderID) => {
    try {
    if (!orderID) {
      throw new Error('Order ID is required');
    }

    const accessToken = await generateAccessToken();

    const response = await axios.post(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
        {},
        {
            timeout: 10000,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
    } catch (error) {
    console.error(
      '❌ PayPal Capture Error:',
      error.response?.data || error.message
    );
    throw new Error('Failed to capture PayPal order');
  }
};

module.exports = {
    createOrder,
    captureOrder,
};
