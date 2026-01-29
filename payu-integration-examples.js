// PayU Integration Test Examples

// 1. Initiate Payment (POST /api/v1/payment/initiate)
const initiatePaymentExample = {
  method: 'POST',
  url: '/api/v1/payment/initiate',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: {
    amount: '1000.00',
    productinfo: 'Ethnic Wear Purchase',
    firstname: 'John',
    email: 'john@example.com',
    phone: '9876543210',
    orderId: 'ORD123456' // Optional, will generate UUID if not provided
  }
};

// Expected Response:
const initiatePaymentResponse = {
  success: true,
  data: {
    key: 'YOUR_PAYU_KEY',
    txnid: 'ORD123456',
    amount: '1000.00',
    productinfo: 'Ethnic Wear Purchase',
    firstname: 'John',
    email: 'john@example.com',
    phone: '9876543210',
    hash: 'generated_hash_string',
    surl: 'https://yourbackend.com/api/v1/payment/success',
    furl: 'https://yourbackend.com/api/v1/payment/failure'
  }
};

// 2. Get Payment Details (GET /api/v1/payment/details/:txnid)
const getPaymentDetailsExample = {
  method: 'GET',
  url: '/api/v1/payment/details/ORD123456',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
};

// Expected Response:
const getPaymentDetailsResponse = {
  success: true,
  data: {
    txnid: 'ORD123456',
    amount: 1000,
    payment_status: 'paid',
    payment_method: 'PayU',
    order_status: 'pending',
    created_at: '2024-01-01T00:00:00.000Z',
    user: {
      _id: 'user_id',
      name: 'John Doe',
      email: 'john@example.com'
    },
    address: {
      // address details
    }
  }
};

// 3. PayU Success Callback (Handled automatically by PayU)
// This endpoint receives POST data from PayU after successful payment
// URL: /api/v1/payment/success

// 4. PayU Failure Callback (Handled automatically by PayU)  
// This endpoint receives POST data from PayU after failed payment
// URL: /api/v1/payment/failure

module.exports = {
  initiatePaymentExample,
  getPaymentDetailsExample
};