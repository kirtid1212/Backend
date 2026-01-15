const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const accessSecret = () => process.env.JWT_SECRET;
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const accessTtl = process.env.JWT_EXPIRES_IN || '15m';
const refreshTtl = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const signAccessToken = (user) => {
  const secret = accessSecret();
  if (!secret) throw new Error('JWT_SECRET is not set');

  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email || '' },
    secret,
    { expiresIn: accessTtl }
  );
};

const signRefreshToken = (user) => {
  const secret = refreshSecret();
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not set');

  return jwt.sign(
    { sub: user._id.toString() },
    secret,
    { expiresIn: refreshTtl }
  );
};

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const decoded = jwt.decode(refreshToken);
  const expiresAt = decoded && decoded.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user_id: user._id,
    token_hash: hashToken(refreshToken),
    expires_at: expiresAt
  });

  return { accessToken, refreshToken };
};

const verifyRefreshToken = async (refreshToken) => {
  const secret = refreshSecret();
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not set');

  let payload = null;
  try {
    payload = jwt.verify(refreshToken, secret);
  } catch (error) {
    return null;
  }

  const tokenHash = hashToken(refreshToken);
  const record = await RefreshToken.findOne({ token_hash: tokenHash, revoked: false });
  if (!record) return null;

  return { payload, record, tokenHash };
};

const revokeRefreshToken = async (tokenHash) => {
  await RefreshToken.updateOne({ token_hash: tokenHash }, { revoked: true });
};

const revokeUserTokens = async (userId) => {
  await RefreshToken.updateMany({ user_id: userId }, { revoked: true });
};

module.exports = {
  issueTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeUserTokens,
  hashToken
};
