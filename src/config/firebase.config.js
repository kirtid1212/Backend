const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        // Check if service account path is provided
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (!serviceAccountPath) {
            console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_PATH not set. Push notifications will be disabled.');
            return null;
        }

        // Load service account
        const serviceAccount = require(path.resolve(serviceAccountPath));

        // Initialize Firebase Admin
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
        return firebaseApp;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        return null;
    }
};

const getMessaging = () => {
    const app = initializeFirebase();
    return app ? admin.messaging() : null;
};

module.exports = {
    initializeFirebase,
    getMessaging,
    admin
};
