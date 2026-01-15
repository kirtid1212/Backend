const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { issueTokens } = require('../../utils/tokens');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ message: 'Admin credentials are not configured' });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (adminEmail !== normalizedEmail || adminPassword !== password) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    let user = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!user) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      user = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: passwordHash,
        role: 'admin',
        is_verified: true
      });
    }

    const tokens = await issueTokens(user);
    res.json({ success: true, user: sanitizeUser(user), tokens });
  } catch (error) {
    console.error('Admin login failed:', error.message);
    res.status(500).json({ message: 'Admin login failed' });
  }
};

module.exports = { login };
