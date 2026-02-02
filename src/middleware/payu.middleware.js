const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Cache for PayU responses (TTL: 5 minutes)
const payuCache = new NodeCache({ stdTTL: 300 });

// Cache for transaction tracking (TTL: 1 hour)
const transactionCache = new NodeCache({ stdTTL: 3600 });

// Circuit breaker for PayU API
const circuitBreaker = {
  failures: 0,
  lastFailureTime: null,
  threshold: 5,
  timeout: 60000, // 1 minute
  isOpen() {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailureTime) < this.timeout;
  },
  recordSuccess() {
    this.failures = 0;
    this.lastFailureTime = null;
  },
  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
};

/**
 * PayU Rate Limiter - More lenient for better UX
 */
const payuRateLimit = rateLimit({
  windowMs: 2000, // 2 seconds
  max: 2, // 2 requests per 2 seconds per user
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  message: {
    success: false,
    message: 'Too many payment requests. Please wait 2 seconds before trying again.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 2
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
 * Enhanced exponential backoff with circuit breaker
 */
const exponentialBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  // Check circuit breaker
  if (circuitBreaker.isOpen()) {
    throw new Error('PayU service temporarily unavailable. Please try again in 60 seconds.');
  }

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      lastError = error;
      
      // Handle PayU rate limiting specifically
      if (error.message?.includes('Too many Requests') || 
          error.response?.status === 429) {
        circuitBreaker.recordFailure();
        throw new Error('Too many Requests');
      }
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        circuitBreaker.recordFailure();
        break;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000); // Max 10s delay
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
      message: 'Payment service is temporarily busy due to high traffic. Please try again in 60 seconds.',
      error: 'PAYU_RATE_LIMIT',
      retryAfter: 60,
      suggestion: 'Please wait and try again. If payment was deducted, contact support.'
    });
  }

  // Handle circuit breaker open state
  if (error.message?.includes('temporarily unavailable')) {
    return res.status(503).json({
      success: false,
      message: 'Payment service is temporarily unavailable due to technical issues.',
      error: 'SERVICE_CIRCUIT_OPEN',
      retryAfter: 60
    });
  }

  // Handle network/timeout errors
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Payment service is temporarily unavailable. Please check your connection and try again.',
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
  handlePayuError,
  circuitBreaker
};