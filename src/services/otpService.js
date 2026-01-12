const bcrypt = require('bcryptjs');
const OTPLog = require('../models/OTPLog');
const { generateOtp } = require('../utils/otp');
const { sendSMS } = require('../utils/sms');

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const sendOtp = async (phone, purpose) => {
  const otp = generateOtp();
  const codeHash = await bcrypt.hash(otp, 10);

  await OTPLog.deleteMany({ phone, purpose });
  await OTPLog.create({
    phone,
    purpose,
    code_hash: codeHash,
    expires_at: new Date(Date.now() + OTP_TTL_MS)
  });

  await sendSMS(phone, otp);
};

const verifyOtp = async (phone, purpose, otp) => {
  const record = await OTPLog.findOne({ phone, purpose }).sort({ createdAt: -1 });

  if (!record) {
    return { ok: false, status: 400, message: 'OTP not found' };
  }

  if (record.expires_at < new Date()) {
    return { ok: false, status: 400, message: 'OTP expired' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, status: 429, message: 'OTP attempts exceeded' };
  }

  const match = await bcrypt.compare(String(otp), record.code_hash);
  record.attempts += 1;
  record.verified = match;
  await record.save();

  if (!match) {
    return { ok: false, status: 400, message: 'Invalid OTP' };
  }

  return { ok: true };
};

module.exports = { sendOtp, verifyOtp };
