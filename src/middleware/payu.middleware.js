const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Cache for PayU responses (TTL: 5 minutes)
const payuCache = new NodeCache({ stdTTL: 300 });

// Cache for transaction tracking (TTL: 1 hour)
const transactionCache = new NodeCache({ stdTTL: 3600 });

/**
 * PayU Rate Limiter - 1 request per second per user
 */
const payuRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: 1, // 1 request per second per IP
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fall back to IP
    return req.user?.id || req.ip;
  },
  message: {
    success: false,
    message: 'Too many payment requests. Please wait 1 second before trying again.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Prevent duplicate transactions
 */
const preventDuplicateTransaction = (req, res, next) => {
  const { orderId } = req.body;
  const userId = req.user?.id;
  
  if (!orderId) {
    return next();
  }

  const transactionKey = `${userId}_${orderId}`;
  
  if (transactionCache.has(transactionKey)) {
    return res.status(409).json({
      success: false,
      message: 'Transaction already in progress. Please wait before retrying.',
      error: 'DUPLICATE_TRANSACTION'
    });
  }

  // Mark transaction as in progress
  transactionCache.set(transactionKey, { 
    status: 'processing', 
    timestamp: Date.now() 
  });

  // Clean up on response
  const originalSend = res.send;
  res.send = function(data) {
    transactionCache.del(transactionKey);
    originalSend.call(this, data);
  };

  next();
};

/**
 * Cache PayU responses for duplicate requests
 */
const cachePayuResponse = (req, res, next) => {
  const { amount, productinfo, firstname, email, orderId } = req.body;
  const userId = req.user?.id;
  
  if (!orderId) {
    return next();
  }

  const cacheKey = `payu_${userId}_${orderId}_${amount}`;
  const cachedResponse = payuCache.get(cacheKey);
  
  if (cachedResponse) {
    console.log(`Returning cached PayU response for: ${orderId}`);
    return res.json(cachedResponse);
  }

  // Override res.json to cache successful responses
  const originalJson = res.json;
  res.json = function(data) {
    if (data.success) {
      payuCache.set(cacheKey, data);
      console.log(`Cached PayU response for: ${orderId}`);
    }
    originalJson.call(this, data);
  };

  next();
};

/**
 * Exponential backoff utility for PayU API calls
 */
const exponentialBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`PayU API attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Enhanced error handler for PayU operations
 */
const handlePayuError = (error, req, res, next) => {
  console.error('PayU Error:', error);

  // Handle rate limiting errors from PayU
  if (error.message?.includes('Too many Requests') || 
      error.response?.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Payment service is temporarily busy. Please try again in 60 seconds.',
      error: 'PAYU_RATE_LIMIT',
      retryAfter: 60
    });
  }

  // Handle network/timeout errors
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Payment service is temporarily unavailable. Please try again.',
      error: 'SERVICE_UNAVAILABLE'
    });
  }

  // Handle validation errors
  if (error.response?.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment parameters provided.',
      error: 'INVALID_PARAMETERS'
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Payment processing failed. Please try again.',
    error: 'PAYMENT_PROCESSING_ERROR'
  });
};

module.exports = {
  payuRateLimit,
  preventDuplicateTransaction,
  cachePayuResponse,
  exponentialBackoff,
  handlePayuError
};