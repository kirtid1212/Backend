const admin = require("firebase-admin");
require("dotenv").config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error("❌ Missing FIREBASE_SERVICE_ACCOUNT_KEY");
}

// 🔐 Parse the JSON from env
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY
);

// ✅ Fix newline issue automatically
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
