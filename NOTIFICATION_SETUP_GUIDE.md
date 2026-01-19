# Notification System - Complete Setup Guide

## 🎯 Overview

This notification system provides real-time push notifications for admin users across all app states:
- ✅ **Foreground** (app open)
- ✅ **Background** (tab minimized/not active)
- ✅ **Terminated** (app closed and reopened)

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Flutter (v3.0 or higher)
- Firebase account
- Chrome browser (for testing)

---

## 🔥 Part 1: Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "ecommerce-admin-notifications")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Cloud Messaging** tab
3. Under **Web Push certificates**, click **Generate key pair**
4. Copy the **VAPID key** (you'll need this later)

### Step 3: Add Web App

1. In Firebase Console, click the **Web icon** (</>)
2. Register app with nickname (e.g., "Admin Dashboard")
3. Copy the Firebase configuration object
4. Click "Continue to console"

### Step 4: Download Service Account Key

1. Go to **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Save the JSON file as `firebase-service-account.json`
4. Move it to `Backend/src/config/firebase-service-account.json`

---

## 🖥️ Part 2: Backend Setup

### Step 1: Install Dependencies

```bash
cd Backend
npm install
```

This will install:
- `firebase-admin` - For sending push notifications
- All existing dependencies

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your values:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./src/config/firebase-service-account.json
```

### Step 3: Update Service Worker Configuration

Edit `public/firebase-messaging-sw.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Replace with your Firebase web config from Step 3 of Firebase Setup.

### Step 4: Add Notification Icons

Create two PNG files in `public/` directory:
- `icon-192x192.png` (192x192 pixels)
- `badge-72x72.png` (72x72 pixels)

Or use placeholder icons for testing.

### Step 5: Start Backend Server

```bash
npm run dev
```

Server should start on `http://localhost:3000`

---

## 📱 Part 3: Flutter Web Admin Dashboard Setup

### Step 1: Navigate to Flutter Project

```bash
cd flutter_admin
```

### Step 2: Install Dependencies

```bash
flutter pub get
```

### Step 3: Configure Firebase for Flutter

1. Install FlutterFire CLI:
```bash
dart pub global activate flutterfire_cli
```

2. Run FlutterFire configure:
```bash
flutterfire configure
```

3. Select your Firebase project
4. Select platforms: **Web** (and others if needed)
5. This will generate/update `lib/firebase_options.dart`

### Step 4: Update Firebase Configuration in Web Files

Edit `web/index.html` and replace Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 5: Add VAPID Key

Edit `lib/core/services/fcm_service.dart`:

Find this line:
```dart
vapidKey: 'YOUR_VAPID_KEY_HERE',
```

Replace with your VAPID key from Firebase Console.

### Step 6: Update Backend URL

Edit `lib/features/notifications/providers/notification_provider.dart`:

```dart
final baseUrlProvider = Provider<String>((ref) {
  return 'http://localhost:3000'; // Your backend URL
});
```

### Step 7: Copy Service Worker

Copy the service worker from backend to Flutter web:

```bash
cp ../public/firebase-messaging-sw.js web/firebase-messaging-sw.js
```

Update the Firebase config in this file as well.

### Step 8: Run Flutter Web App

```bash
flutter run -d chrome --web-port 8080
```

---

## 🧪 Part 4: Testing

### Test 1: Foreground Notifications

1. Open admin dashboard in Chrome
2. Allow notifications when prompted
3. Create a test order using Postman or user app
4. **Expected**: Toast notification appears in the dashboard
5. **Expected**: Notification bell badge updates
6. **Expected**: Notification appears in notifications list

### Test 2: Background Notifications

1. Keep admin dashboard open
2. Switch to another tab
3. Create a test order
4. **Expected**: Browser push notification appears
5. Click the notification
6. **Expected**: Dashboard tab comes to focus
7. **Expected**: Notification is in the list

### Test 3: Terminated State Notifications

1. Close all admin dashboard tabs
2. Create a test order
3. **Expected**: Browser push notification appears
4. Click the notification
5. **Expected**: Admin dashboard opens
6. **Expected**: Notification is in the list

### Test 4: Duplicate Prevention

1. Note an existing order ID
2. Try to create notification for same order+type
3. **Expected**: Only one notification exists

### Test 5: Mark as Read

1. Click on an unread notification
2. **Expected**: Notification marked as read
3. **Expected**: Badge count decreases

### Test 6: Filters

1. Create notifications of different types
2. Test each filter (All, Orders, Payments, Delivery)
3. **Expected**: Correct notifications shown

---

## 🔧 Troubleshooting

### Issue: No FCM Token Generated

**Solution:**
- Check browser console for errors
- Ensure VAPID key is correct
- Verify Firebase project settings
- Check if notifications are allowed in browser

### Issue: Service Worker Not Registering

**Solution:**
- Check browser console
- Ensure service worker file is at `/firebase-messaging-sw.js`
- Clear browser cache
- Check Firebase config in service worker

### Issue: Notifications Not Received

**Solution:**
- Check backend logs for Firebase errors
- Verify service account JSON is correct
- Check if token is registered in database
- Test with "Send Test Notification" API

### Issue: CORS Errors

**Solution:**
- Ensure backend has CORS enabled
- Check if backend URL is correct in Flutter app
- Verify API endpoints are accessible

---

## 📊 Monitoring

### Check Registered Tokens

Query MongoDB:
```javascript
db.admintokens.find({ isActive: true })
```

### Check Notifications

```javascript
db.notifications.find().sort({ createdAt: -1 }).limit(10)
```

### Check Backend Logs

Look for:
- ✅ Firebase Admin SDK initialized successfully
- ✅ Push notifications sent: X success, Y failures
- ❌ Failed to send to token: [error]

---

## 🚀 Production Deployment

### Backend

1. Set environment variables on server
2. Upload Firebase service account JSON securely
3. Ensure MongoDB is accessible
4. Configure HTTPS
5. Update CORS settings for production domain

### Flutter Web

1. Build production bundle:
```bash
flutter build web --release
```

2. Deploy `build/web` directory to hosting
3. Update backend URL in code
4. Ensure service worker is served from root
5. Configure HTTPS

---

## 📝 API Endpoints

### Notification Management

- `POST /api/v1/admin/notifications/register-token` - Register FCM token
- `GET /api/v1/admin/notifications` - Get all notifications
- `GET /api/v1/admin/notifications/unread-count` - Get unread count
- `PATCH /api/v1/admin/notifications/:id/read` - Mark as read
- `PATCH /api/v1/admin/notifications/read-all` - Mark all as read
- `DELETE /api/v1/admin/notifications/:id` - Delete notification
- `POST /api/v1/admin/notifications/test` - Send test notification
- `DELETE /api/v1/admin/notifications/unregister-token` - Unregister token

---

## 🎨 Customization

### Notification Icons

Replace icons in:
- `Backend/public/icon-192x192.png`
- `Backend/public/badge-72x72.png`
- `flutter_admin/web/icons/`

### Notification Sound

Add to service worker:
```javascript
notificationOptions: {
  ...
  sound: '/notification-sound.mp3'
}
```

### Notification Styling

Edit `flutter_admin/lib/features/notifications/presentation/widgets/notification_item_widget.dart`

---

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Flutter Firebase Messaging](https://firebase.flutter.dev/docs/messaging/overview)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## ✅ Checklist

- [ ] Firebase project created
- [ ] VAPID key generated
- [ ] Service account JSON downloaded
- [ ] Backend dependencies installed
- [ ] Environment variables configured
- [ ] Firebase config updated in backend
- [ ] Backend server running
- [ ] Flutter dependencies installed
- [ ] Firebase config updated in Flutter
- [ ] VAPID key added to Flutter
- [ ] Service worker configured
- [ ] Flutter app running
- [ ] Foreground notifications working
- [ ] Background notifications working
- [ ] Terminated state notifications working
- [ ] All filters working
- [ ] Mark as read working
- [ ] Duplicate prevention working

---

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify all configuration files
4. Test with Postman collection
5. Review Firebase Console for errors
