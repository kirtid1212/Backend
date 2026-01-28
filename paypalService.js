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
    const accessToken = await generateAccessToken();

    const response = await axios.post(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: total,
                    },
                },
            ],
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();

    const response = await axios.post(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
        {},
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

module.exports = {
    createOrder,
    captureOrder,
};
