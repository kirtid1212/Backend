const express = require("express");
const paypalRoutes = require("./routes/paypal.routes");
const paypalWebhook = require("./webhooks/paypal.webhook");

const app = express();

app.use(express.json());

app.use("/api/paypal", paypalRoutes);
app.post("/api/paypal/webhook", paypalWebhook);

module.exports = app;
