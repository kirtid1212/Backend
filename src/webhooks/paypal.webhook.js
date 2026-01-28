const Transaction = require("../models/transaction.model");

module.exports = async (req, res) => {
  const event = req.body.event_type;

  if (event === "PAYMENT.CAPTURE.COMPLETED") {
    const capture = req.body.resource;

    await Transaction.findOneAndUpdate(
      { transactionId: capture.id },
      { status: "PAID" }
    );
  }

  res.sendStatus(200);
};
