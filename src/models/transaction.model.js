const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    orderId: String,
    transactionId: String,
    amount: Number,
    currency: String,
    status: String,
    paymentMethod: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
