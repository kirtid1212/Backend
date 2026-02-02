/**
 * Enhanced Error Handling Utility for PayU Integration
 * Handles conflicts, rate limiting, and provides user-friendly messages
 */

class PayUErrorHandler {
  /**
   * Handle PayU API errors with appropriate responses
   */
  static handleApiError(error, context = '') {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      originalError: error.message
    };

    // Rate limiting errors
    if (this.isRateLimitError(error)) {
      return {
        status: 429,
        response: {
          success: false,
          message: 'Payment service is experiencing high traffic. Please try again in 60 seconds.',
          error: 'PAYU_RATE_LIMIT',
          retryAfter: 60,
          userAction: 'Please wait and try again. If payment was deducted, contact support.',
          supportInfo: 'care@payu.in',
          ...errorInfo
        }
      };
    }

    // Network/connectivity errors
    if (this.isNetworkError(error)) {
      return {
        status: 503,
        response: {
          success: false,
          message: 'Payment service is temporarily unavailable. Please check your connection.',
          error: 'SERVICE_UNAVAILABLE',
          userAction: 'Check your internet connection and try again.',
          ...errorInfo
        }
      };
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return {
        status: 400,
        response: {
          success: false,
          message: 'Invalid payment information provided.',
          error: 'INVALID_PARAMETERS',
          userAction: 'Please check your payment details and try again.',
          ...errorInfo
        }
      };
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      return {
        status: 401,
        response: {
          success: false,
          message: 'Payment authentication failed.',
          error: 'AUTHENTICATION_FAILED',
          userAction: 'Please refresh and try again.',
          ...errorInfo
        }
      };
    }

    // Generic server error
    return {
      status: 500,
      response: {
        success: false,
        message: 'Payment processing failed due to technical issues.',
        error: 'PAYMENT_PROCESSING_ERROR',
        userAction: 'Please try again. If the issue persists, contact support.',
        ...errorInfo
      }
    };
  }

  /**
   * Check if error is rate limiting related
   */
  static isRateLimitError(error) {
    return error.message?.includes('Too many Requests') ||
           error.response?.status === 429 ||
           error.message?.includes('rate limit') ||
           error.message?.includes('RATE_LIMIT');
  }

  /**
   * Check if error is network related
   */
  static isNetworkError(error) {
    return error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT' ||
           error.code === 'ENOTFOUND' ||
           error.code === 'ECONNREFUSED' ||
           error.message?.includes('network') ||
           error.message?.includes('timeout');
  }

  /**
   * Check if error is validation related
   */
  static isValidationError(error) {
    return error.response?.status === 400 ||
           error.message?.includes('validation') ||
           error.message?.includes('invalid') ||
           error.message?.includes('required');
  }

  /**
   * Check if error is authentication related
   */
  static isAuthError(error) {
    return error.response?.status === 401 ||
           error.response?.status === 403 ||
           error.message?.includes('unauthorized') ||
           error.message?.includes('authentication');
  }

  /**
   * Handle transaction conflicts
   */
  static handleTransactionConflict(txnid, existingStatus) {
    return {
      status: 409,
      response: {
        success: false,
        message: `Transaction ${txnid} already exists with status: ${existingStatus}`,
        error: 'TRANSACTION_CONFLICT',
        data: {
          txnid,
          existingStatus
        },
        userAction: existingStatus === 'paid' 
          ? 'This payment has already been completed.' 
          : 'Please use a different transaction ID or check the existing transaction status.'
      }
    };
  }

  /**
   * Handle duplicate payment attempts
   */
  static handleDuplicatePayment(txnid, amount) {
    return {
      status: 409,
      response: {
        success: false,
        message: 'Duplicate payment attempt detected.',
        error: 'DUPLICATE_PAYMENT',
        data: {
          txnid,
          amount
        },
        userAction: 'Please check if your previous payment was successful before retrying.'
      }
    };
  }

  /**
   * Create user-friendly error response
   */
  static createUserFriendlyResponse(error, context) {
    const handled = this.handleApiError(error, context);
    
    // Add helpful suggestions based on error type
    if (this.isRateLimitError(error)) {
      handled.response.suggestions = [
        'Wait for 60 seconds before trying again',
        'Check if payment was already processed',
        'Contact support if payment was deducted: care@payu.in'
      ];
    } else if (this.isNetworkError(error)) {
      handled.response.suggestions = [
        'Check your internet connection',
        'Try again in a few minutes',
        'Use a different network if possible'
      ];
    }

    return handled;
  }
}

module.exports = PayUErrorHandler;