const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendSMS = async (mobile, otp) => {
  try {
    await client.messages.create({
      body: `Your OTP is ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE, 
      to: mobile 
    });

    console.log("OTP sent to", mobile);
  } catch (error) {
    console.error("Twilio Error:", error.message);
    throw new Error("OTP SMS failed");
  }
};