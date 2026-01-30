const admin = require('firebase-admin');
const path = require('path');

if (!admin.apps.length) {
  try {
    let serviceAccount = null;

    // ✅ RENDER / PRODUCTION
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }

    // ✅ LOCAL DEVELOPMENT
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      serviceAccount = require(
        path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      );
    }

    else {
      console.warn(
        '⚠️ Firebase credentials not set. Push notifications are disabled.'
      );
      module.exports = admin;
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');

  } catch (error) {
    console.error(
      '❌ Failed to initialize Firebase Admin SDK:',
      error.message
    );
  }
}

module.exports = admin;




















// const admin = require('firebase-admin');

// if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
//   console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment');
// } else if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(
//       JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
//     ),
//   });
// }

// module.exports = admin;
