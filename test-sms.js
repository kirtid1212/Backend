require('dotenv').config();
const { sendSMS } = require('./utils/sms');

async function testSMS() {
  console.log('🧪 Testing SMS functionality...');
  
  const testPhone = '+919876543210'; // Test phone number
  const testOTP = '123456';
  
  try {
    const result = await sendSMS(testPhone, testOTP);
    console.log('📱 SMS Test Result:', result);
    
    if (result.success) {
      console.log('✅ SMS functionality is working correctly');
    } else {
      console.log('❌ SMS functionality has issues:', result.error);
    }
  } catch (error) {
    console.error('💥 SMS test failed:', error.message);
  }
}

testSMS();