# Firebase Cloud Messaging Backend Integration

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

The `firebase-admin` package has been added to handle push notifications.

### 2. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file to your backend directory
6. Add to `.env` file:
```env
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./path/to/serviceAccountKey.json
```

### 3. Enable Cloud Messaging API
1. In Firebase Console, go to **Cloud Messaging** tab
2. Enable the API if not already enabled

### 4. Database Models

A new `DeviceToken` model has been created to store user FCM tokens:
- `userId`: Reference to the user
- `fcmToken`: Firebase Cloud Messaging token
- `deviceName`: Device name (optional)
- `deviceType`: Type of device (web, android, ios, other)
- `isActive`: Boolean to track active devices
- `lastUsed`: Last time the token was used

## API Endpoints

### User Endpoints (Authenticated)

#### 1. Register/Update Device Token
```
POST /api/v1/notifications/register-device
Authorization: Bearer {token}

Body:
{
  "fcmToken": "device_token_here",
  "deviceName": "iPhone 12",
  "deviceType": "ios"
}

Response:
{
  "success": true,
  "message": "Device token registered",
  "isNew": true
}
```

#### 2. Unregister Device Token
```
POST /api/v1/notifications/unregister-device
Authorization: Bearer {token}

Body:
{
  "fcmToken": "device_token_here"
}

Response:
{
  "success": true,
  "message": "Device token unregistered"
}
```

#### 3. Get User's Active Devices
```
GET /api/v1/notifications/devices
Authorization: Bearer {token}

Response:
{
  "success": true,
  "devices": [
    {
      "_id": "device_id",
      "deviceName": "iPhone 12",
      "deviceType": "ios",
      "isActive": true,
      "lastUsed": "2024-01-28T10:30:00.000Z",
      "createdAt": "2024-01-28T10:30:00.000Z"
    }
  ]
}
```

#### 4. Send Test Notification
```
POST /api/v1/notifications/test
Authorization: Bearer {token}

Body (Optional):
{
  "title": "Custom Title",
  "body": "Custom test message"
}

Response:
{
  "success": true,
  "successCount": 1,
  "failureCount": 0
}
```

### Admin Endpoints (Authenticated as Admin)

#### 1. Send to Specific Device
```
POST /api/v1/notifications/send-to-device
Authorization: Bearer {admin_token}

Body:
{
  "fcmToken": "device_token",
  "title": "Order Confirmation",
  "body": "Your order has been confirmed",
  "data": {
    "type": "order",
    "orderId": "123456",
    "action": "view_order"
  }
}

Response:
{
  "success": true,
  "messageId": "response_id"
}
```

#### 2. Send to Specific User
```
POST /api/v1/notifications/send-to-user
Authorization: Bearer {admin_token}

Body:
{
  "userId": "user_id",
  "title": "Special Offer",
  "body": "You have a new special offer!",
  "data": {
    "type": "promotion",
    "promoId": "xyz123"
  }
}

Response:
{
  "success": true,
  "successCount": 2,
  "failureCount": 0
}
```

#### 3. Send to Multiple Users
```
POST /api/v1/notifications/send-to-users
Authorization: Bearer {admin_token}

Body:
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"],
  "title": "System Maintenance",
  "body": "Scheduled maintenance will occur tonight",
  "data": {
    "type": "system",
    "severity": "info"
  }
}

Response:
{
  "success": true,
  "successCount": 5,
  "failureCount": 1
}
```

#### 4. Send Broadcast (All Users)
```
POST /api/v1/notifications/broadcast
Authorization: Bearer {admin_token}

Body:
{
  "title": "New Features Available",
  "body": "Check out our latest features!",
  "data": {
    "type": "announcement",
    "link": "/features"
  }
}

Response:
{
  "success": true,
  "successCount": 150,
  "failureCount": 2,
  "message": "Broadcast sent to 150 devices across 148 users"
}
```

#### 5. Get Notification Statistics
```
GET /api/v1/notifications/stats
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "stats": {
    "totalDevices": 250,
    "activeDevices": 248,
    "inactiveDevices": 2,
    "devicesByType": [
      { "_id": "android", "count": 120 },
      { "_id": "ios", "count": 100 },
      { "_id": "web", "count": 28 }
    ]
  }
}
```

## Notification Payload Format

### Basic Notification
```json
{
  "notification": {
    "title": "Notification Title",
    "body": "Notification Body"
  },
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

### Data Types Supported in `data` Field
- `type`: "order", "promotion", "system", "alert", etc.
- `action`: Navigation action to perform
- `id`: Reference ID (orderId, promoId, etc.)
- `link`: Deep link
- `timestamp`: ISO timestamp

## Common Use Cases

### 1. Order Notifications
```javascript
const result = await sendNotificationToUser(userId, 
  "Order Confirmed",
  "Your order #12345 has been confirmed",
  {
    type: "order",
    orderId: "12345",
    action: "view_order"
  }
);
```

### 2. Promotion Notifications
```javascript
const result = await sendNotificationToUsers(userIds,
  "Flash Sale!",
  "Get 50% off on selected items",
  {
    type: "promotion",
    promoId: "flash50",
    action: "view_promo"
  }
);
```

### 3. Delivery Status Update
```javascript
const result = await sendNotificationToUser(userId,
  "Delivery Update",
  "Your order is out for delivery",
  {
    type: "delivery",
    orderId: "12345",
    status: "in_transit",
    action: "track_order"
  }
);
```

### 4. System Notifications
```javascript
const result = await sendNotificationToUsers(allUserIds,
  "System Maintenance",
  "Service will be unavailable 2-3 AM EST",
  {
    type: "system",
    severity: "warning"
  }
);
```

## Frontend Integration

The Flutter frontend will automatically:
1. Receive FCM tokens on app startup
2. Send token to backend via `/register-device` endpoint
3. Listen to incoming notifications
4. Display notifications in system tray
5. Handle notification taps to navigate in app

### Example Flutter Code
```dart
// Register device when user logs in
await http.post(
  Uri.parse('https://api.example.com/api/v1/notifications/register-device'),
  headers: {'Authorization': 'Bearer $token'},
  body: jsonEncode({
    'fcmToken': fcmToken,
    'deviceName': 'My Phone',
    'deviceType': 'android'
  }),
);

// Listen to notifications
FirebaseMessaging.onMessage.listen((message) {
  print('Notification: ${message.notification?.title}');
  print('Data: ${message.data}');
});
```

## Error Handling

### Invalid Token
- Automatically marks token as inactive
- Remove from future sends

### Exceeded Rate Limit
- FCM has rate limits per device
- Handled with exponential backoff

### Device Offline
- Notification queued by FCM
- Delivered when device comes online

## Best Practices

1. **Token Management**
   - Register token on app start
   - Listen to token refresh and re-register
   - Unregister when user logs out

2. **Notification Content**
   - Keep titles under 35 characters
   - Keep body under 100 characters
   - Use clear, actionable language

3. **Frequency**
   - Don't spam users with notifications
   - Respect user preferences
   - Implement notification settings

4. **Data Payload**
   - Include enough data for deep linking
   - Keep data payload minimal
   - Use JSON for complex data

5. **Testing**
   - Use the test endpoint to verify setup
   - Test across different device types
   - Monitor logs for errors

## Troubleshooting

### Notifications Not Received
1. Check FCM token is valid
2. Verify Firebase service account key
3. Check internet connectivity
4. Verify app has notification permissions
5. Check `isActive` status in DeviceToken

### Token Issues
```javascript
// Manually update token if needed
await DeviceToken.updateOne(
  { _id: tokenId },
  { isActive: true, lastUsed: new Date() }
);
```

### View Logs
```javascript
// Get all active tokens for debugging
const activeTokens = await DeviceToken.find({ isActive: true });
```

## Monitoring and Analytics

Track notification metrics:
- Delivery rate (successes vs failures)
- Active devices over time
- Device type distribution
- Token refresh frequency

Example query:
```javascript
const stats = await getNotificationStats();
console.log(`Active devices: ${stats.stats.activeDevices}`);
console.log(`Delivery success rate: ${(successCount/totalCount)*100}%`);
```

## Security Considerations

1. ✅ All endpoints require authentication
2. ✅ Admin endpoints require admin role
3. ✅ FCM tokens are indexed for quick lookup
4. ✅ Tokens masked in device list response
5. ✅ Rate limiting recommended on production
6. ✅ Use HTTPS only in production

## Production Checklist

- [ ] Firebase service account key securely stored
- [ ] Environment variables configured
- [ ] Rate limiting implemented
- [ ] Error logging configured
- [ ] Token cleanup scheduled (remove old inactive tokens)
- [ ] Admin role checks implemented
- [ ] Notification preferences added to user model
- [ ] Testing completed across platforms
- [ ] Monitoring/alerts setup
- [ ] Documentation shared with team
