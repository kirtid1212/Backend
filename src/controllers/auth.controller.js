const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  issueTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeUserTokens
} = require('../utils/tokens');

/**
 * Remove sensitive fields before sending user data
 */
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,        // ✅ added
  role: user.role
});

/**
 * POST /api/v1/auth/signup
 */
const signup = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body; // ✅ phone added

    // Required field check
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Name, email, password and confirmPassword are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check email uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // ✅ Check phone uniqueness ONLY if phone is provided
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({ message: 'Phone number already in use' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // ✅ Save phone to database
    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: phone || null,
      password: passwordHash,
      role: 'user',
      is_verified: true
    });

    const tokens = await issueTokens(user);

    res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      tokens
    });
  } catch (error) {
    console.error('Signup failed:', error.message);
    res.status(500).json({ message: 'Signup failed' });
  }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = await issueTokens(user);
    res.json({ success: true, user: sanitizeUser(user), tokens });
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(500).json({ message: 'Login failed' });
  }
};

/**
 * POST /api/v1/auth/refresh
 */
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
    console.error('Token refresh failed:', error.message);
    res.status(500).json({ message: 'Token refresh failed' });
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res) => {
  try {
    await revokeUserTokens(req.user.id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout failed:', error.message);
    res.status(500).json({ message: 'Logout failed' });
  }
};

module.exports = {
  signup,
  login,
  refresh,
  logout
};