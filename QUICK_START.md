# 🚀 Quick Start Guide - Notification System

## ⚡ 5-Minute Setup (Development)

### Step 1: Firebase Setup (2 minutes)
1. Go to https://console.firebase.google.com/
2. Create new project → "ecommerce-notifications"
3. Go to Project Settings → Cloud Messaging → Generate VAPID key
4. Go to Service Accounts → Generate new private key
5. Save as `Backend/src/config/firebase-service-account.json`

### Step 2: Backend Setup (1 minute)
```bash
cd Backend

# Already installed! Just configure
cp .env.example .env

# Edit .env and add your MongoDB URI
# FIREBASE_SERVICE_ACCOUNT_PATH is already set
```

### Step 3: Update Firebase Config (2 minutes)

**Get your Firebase config from Firebase Console → Project Settings → Web app**

Update these 5 files with your Firebase config:

1. `Backend/public/firebase-messaging-sw.js` (line 6-13)
2. `flutter_admin/lib/firebase_options.dart` (line 38-44)
3. `flutter_admin/web/index.html` (line 23-29)
4. `flutter_admin/web/firebase-messaging-sw.js` (copy from backend)
5. `flutter_admin/lib/core/services/fcm_service.dart` (line 102 - add VAPID key)

### Step 4: Start Backend
```bash
cd Backend
npm run dev
```

### Step 5: Run Flutter (Optional - for full testing)
```bash
cd flutter_admin
flutter pub get
flutter run -d chrome --web-port 8080
```

---

## 🧪 Quick Test

### Test 1: Check Backend
```bash
curl http://localhost:3000/health
# Should return: {"status":"OK","timestamp":"..."}
```

### Test 2: Test Notification API (with Postman)
1. Import `notification_system_postman.json`
2. Login as admin to get JWT token
3. Try "Get All Notifications" endpoint

### Test 3: Create Order (triggers notification)
Use existing order creation endpoint - notification will be created automatically!

---

## 📋 Configuration Checklist

### Must Configure (Before Running)
- [ ] Firebase service account JSON downloaded
- [ ] `.env` file created with MongoDB URI
- [ ] Firebase config updated in service worker (backend)
- [ ] Dependencies installed (`npm install` - ✅ Done!)

### Optional (For Full Flutter Testing)
- [ ] Firebase config in `firebase_options.dart`
- [ ] VAPID key in `fcm_service.dart`
- [ ] Backend URL in `notification_provider.dart`
- [ ] Firebase config in Flutter web files

---

## 🎯 What Works Right Now

### ✅ Backend (Ready to Test)
- All notification APIs
- Order triggers for notifications
- Duplicate prevention
- Database models

### ⚠️ Needs Firebase Config
- Push notifications (requires Firebase setup)
- FCM token registration (requires VAPID key)

### 📱 Flutter Dashboard
- Complete UI ready
- Needs Firebase configuration to run

---

## 🔥 Firebase Config Template

Copy this and replace with your values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                    // From Firebase Console
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

---

## 📚 Full Documentation

- **Complete Setup**: [NOTIFICATION_SETUP_GUIDE.md](file:///c:/Users/ravin/OneDrive/Desktop/Backend/NOTIFICATION_SETUP_GUIDE.md)
- **Testing Guide**: [TESTING_CHECKLIST.md](file:///c:/Users/ravin/OneDrive/Desktop/Backend/TESTING_CHECKLIST.md)
- **Full README**: [NOTIFICATION_SYSTEM_README.md](file:///c:/Users/ravin/OneDrive/Desktop/Backend/NOTIFICATION_SYSTEM_README.md)
- **Implementation Details**: [walkthrough.md](file:///C:/Users/ravin/.gemini/antigravity/brain/66b281e3-2cfb-40be-8cb9-89c3a48f5656/walkthrough.md)

---

## 🆘 Quick Troubleshooting

**Backend won't start?**
- Check MongoDB connection in `.env`
- Ensure port 3000 is available

**No push notifications?**
- Verify Firebase service account JSON path
- Check Firebase config in service worker
- Ensure VAPID key is correct

**Flutter errors?**
- Run `flutter pub get`
- Check Firebase config in all files
- Ensure Chrome is installed

---

## 🎉 You're Ready!

1. Configure Firebase (5 minutes)
2. Start backend: `npm run dev`
3. Test APIs with Postman
4. Create orders to see notifications in action!

For production deployment, see the full setup guide.
