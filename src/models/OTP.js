const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  otp: { type: String, required: true }, // hashed
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false }
});

module.exports = mongoose.model("OTP", otpSchema);