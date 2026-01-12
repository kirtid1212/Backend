const User = require('../models/User');
const { normalizePhone, isValidPhone } = require('../utils/phone');
const { sendOtp, verifyOtp } = require('../services/otpService');
const {
  issueTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeUserTokens
} = require('../utils/tokens');

const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role
  };
};

const sendOtpHandler = async (req, res) => {
  try {
    const { phone, purpose } = req.body;

    if (!phone || !purpose) {
      return res.status(400).json({ message: 'Phone and purpose are required' });
    }

    if (!['signup', 'login'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid purpose' });
    }

    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const existingUser = await User.findOne({ phone: normalized });
    if (purpose === 'signup' && existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    if (purpose === 'login' && !existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await sendOtp(normalized, purpose);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'OTP sending failed' });
  }
};

const verifySignup = async (req, res) => {
  try {
    const { name, phone, otp } = req.body;
    if (!name || !phone || !otp) {
      return res.status(400).json({ message: 'Name, phone, and otp are required' });
    }

    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const result = await verifyOtp(normalized, 'signup', otp);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    let user = await User.findOne({ phone: normalized });
    if (user && user.is_verified) {
      return res.status(409).json({ message: 'User already verified' });
    }

    if (!user) {
      user = await User.create({
        name,
        phone: normalized,
        role: 'user',
        is_verified: true
      });
    } else {
      user.name = name;
      user.is_verified = true;
      await user.save();
    }

    const tokens = await issueTokens(user);
    res.json({ success: true, user: sanitizeUser(user), tokens });
  } catch (error) {
    res.status(500).json({ message: 'Signup verification failed' });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and otp are required' });
    }

    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const user = await User.findOne({ phone: normalized });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await verifyOtp(normalized, 'login', otp);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    const tokens = await issueTokens(user);
    res.json({ success: true, user: sanitizeUser(user), tokens });
  } catch (error) {
    res.status(500).json({ message: 'Login verification failed' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const verified = await verifyRefreshToken(refreshToken);
    if (!verified) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(verified.payload.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await revokeRefreshToken(verified.tokenHash);
    const tokens = await issueTokens(user);
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed' });
  }
};

const logout = async (req, res) => {
  try {
    await revokeUserTokens(req.user.id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

module.exports = {
  sendOtp: sendOtpHandler,
  verifySignup,
  verifyLogin,
  refresh,
  logout
};
