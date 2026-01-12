require('dotenv').config();
const twilio = require('twilio');

console.log('Testing Twilio Configuration...');
console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('Auth Token:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING');
console.log('Phone Number:', process.env.TWILIO_PHONE);

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Test account info
client.api.accounts(process.env.TWILIO_ACCOUNT_SID)
  .fetch()
  .then(account => {
    console.log('✅ Twilio Account Status:', account.status);
    console.log('✅ Account Type:', account.type);
  })
  .catch(error => {
    console.error('❌ Twilio Account Error:', error.message);
  });