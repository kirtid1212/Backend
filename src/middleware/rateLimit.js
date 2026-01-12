const rateLimitStore = new Map();

const rateLimitAddressCreation = (req, res, next) => {
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const userLimit = rateLimitStore.get(userId);
  
  if (now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (userLimit.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many address creation requests' });
  }

  userLimit.count++;
  next();
};

module.exports = { rateLimitAddressCreation };