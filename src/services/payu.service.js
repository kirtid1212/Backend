const { exponentialBackoff, circuitBreaker } = require('../middleware/payu.middleware');
const { generatePaymentHash, verifyPaymentHash } = require('../../payu');

/**
 * PayU Service with enhanced error handling and rate limiting
 */
class PayUService {
  constructor() {
    this.requestQueue = [];
    this.processing = false;
    this.lastRequestTime = 0;
    this.minInterval = 1000; // Minimum 1 second between requests
  }

  /**
   * Queue-based request processing to prevent rate limiting
   */
  async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const { fn, resolve, reject } = this.requestQueue.shift();
      
      try {
        // Ensure minimum interval between requests
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minInterval) {
          await new Promise(resolve => 
            setTimeout(resolve, this.minInterval - timeSinceLastRequest)
          );
        }

        const result = await exponentialBackoff(fn);
        this.lastRequestTime = Date.now();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Small delay between queue items
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  /**
   * Add request to queue
   */
  async queueRequest(fn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Generate payment hash with queue management
   */
  async generateHash(params) {
    return this.queueRequest(() => {
      return Promise.resolve(generatePaymentHash(params));
    });
  }

  /**
   * Verify payment hash with queue management
   */
  async verifyHash(params) {
    return this.queueRequest(() => {
      return Promise.resolve(verifyPaymentHash(params));
    });
  }

  /**
   * Check if service is available
   */
  isServiceAvailable() {
    return !circuitBreaker.isOpen();
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      available: this.isServiceAvailable(),
      queueLength: this.requestQueue.length,
      processing: this.processing,
      circuitBreakerOpen: circuitBreaker.isOpen(),
      failures: circuitBreaker.failures,
      lastFailureTime: circuitBreaker.lastFailureTime
    };
  }
}

// Export singleton instance
module.exports = new PayUService();