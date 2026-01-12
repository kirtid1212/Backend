const User = require('../../models/User');
const { normalizePhone, isValidPhone } = require('../../utils/phone');
const { verifyOtp } = require('../../services/otpService');
const { issueTokens } = require('../../utils/tokens');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  role: user.role
});

const signup = async (req, res) => {
  try {
    const { name, phone, otp, secret } = req.body;
    if (!name || !phone || !otp) {
      return res.status(400).json({ message: 'Name, phone, and otp are required' });
    }

    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const requiredSecret = process.env.ADMIN_SIGNUP_SECRET;
    const providedSecret = req.header('x-admin-signup-secret') || secret;
    if (requiredSecret && requiredSecret !== providedSecret) {
      return res.status(403).json({ message: 'Invalid admin signup secret' });
    }

    const existingUser = await User.findOne({ phone: normalized });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const result = await verifyOtp(normalized, 'signup', otp);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    const user = await User.create({
      name,
      phone: normalized,
      role: 'admin',
      is_verified: true
    });

    const tokens = await issueTokens(user);
    res.status(201).json({ success: true, user: sanitizeUser(user), tokens });
  } catch (error) {
    res.status(500).json({ message: 'Admin signup failed' });
  }
};

const login = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and otp are required' });
    }

    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const user = await User.findOne({ phone: normalized, role: 'admin' });
    if (!user) {
      return res.status(403).json({ message: 'Admin account not found' });
    }

    const result = await verifyOtp(normalized, 'login', otp);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    const tokens = await issueTokens(user);
    res.json({ success: true, user: sanitizeUser(user), tokens });
  } catch (error) {
    res.status(500).json({ message: 'Admin login failed' });
  }
};

module.exports = { signup, login };
