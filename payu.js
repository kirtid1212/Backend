const crypto = require("crypto");

/**
 * Dynamic Hash Generation for PayU Flutter CheckoutPro SDK
 * Supports: V1 (SHA-512), V2 (HMAC-SHA256), Post Salt
 */
exports.generateHash = (req, res) => {
  try {
    const {
      hashName,
      hashString,
      hashType,
      postSalt
    } = req.body;

    // Validate required parameters
    if (!hashName || !hashString) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'hashName and hashString are required'
      });
    }

    const salt = process.env.PAYU_SALT;

    if (!salt) {
      return res.status(500).json({
        success: false,
        error: 'Configuration error',
        message: 'PAYU_SALT not configured'
      });
    }

    let hash;

    // V2 Hash - Uses HMAC-SHA256
    if (hashType === "V2") {
      console.log(`Generating V2 hash for: ${hashName}`);
      hash = crypto
        .createHmac('sha256', salt)
        .update(hashString)
        .digest('hex');
    }
    // Post Salt Hash - SHA-512 with salt + postSalt
    else if (postSalt) {
      console.log(`Generating Post Salt hash for: ${hashName}`);
      const finalHashString = hashString + salt + postSalt;
      hash = crypto
        .createHash('sha512')
        .update(finalHashString)
        .digest('hex');
    }
    // Standard V1 Hash - SHA-512 with salt
    else {
      console.log(`Generating V1 hash for: ${hashName}`);
      const finalHashString = hashString + salt;
      hash = crypto
        .createHash('sha512')
        .update(finalHashString)
        .digest('hex');
    }

    console.log(`Hash generated successfully for: ${hashName}`);

    // Return hash in the format expected by Flutter SDK
    res.json({
      success: true,
      [hashName]: hash
    });

  } catch (error) {
    console.error('Hash generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Hash generation failed',
      message: error.message
    });
  }
};

/**
 * Generate Payment Hash for Payment Initiation
 */
exports.generatePaymentHash = (params) => {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = ''
  } = params;

  const salt = process.env.PAYU_SALT;

  // PayU payment hash formula
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;

  const hash = crypto
    .createHash('sha512')
    .update(hashString)
    .digest('hex');

  return hash;
};

/**
 * Verify Payment Response Hash
 */
exports.verifyPaymentHash = (params) => {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    receivedHash,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = ''
  } = params;

  const salt = process.env.PAYU_SALT;

  // PayU response hash formula (reverse order)
  const hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

  const calculatedHash = crypto
    .createHash('sha512')
    .update(hashString)
    .digest('hex');

  return calculatedHash === receivedHash;
};
