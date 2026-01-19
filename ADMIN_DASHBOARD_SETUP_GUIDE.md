# Admin Dashboard Backend - Setup & Integration Guide

## Overview
Complete backend implementation for Admin Dashboard with 5 core modules:
- ✅ Dashboard Analytics
- ✅ Customers/Users Management
- ✅ Reviews Management
- ✅ Notifications Management
- ✅ Admin Users Management

---

## 📁 Project Structure

```
src/
├── controllers/admin/
│   ├── analytics.controller.js          # Dashboard metrics & charts
│   ├── customers.controller.js          # User/Customer management
│   ├── reviews.controller.js            # Review moderation
│   ├── notifications.controller.js      # Notification management
│   └── admin-users.controller.js        # Admin user management
├── routes/v1/admin/
│   ├── analytics.routes.js
│   ├── customers.routes.js
│   ├── reviews.routes.js
│   ├── notifications-admin.routes.js
│   ├── admin-users.routes.js
│   └── index.js                         # Main admin routes
```

---

## 🚀 Getting Started

### 1. **Install Dependencies** (if not already installed)

```bash
npm install express mongoose bcryptjs
```

### 2. **Database Models** (Already Exist)
Ensure these models exist in `src/models/`:
- `User.js` - User/Admin schema
- `Order.js` - Orders
- `Product.js` - Products
- `Review.js` - Reviews
- `Notification.js` - Notifications
- `Category.js` - Categories

### 3. **Authentication Middleware** (Already Exists)
File: `src/middleware/auth.middleware.js`

Required functions:
- `authenticate` - Verify JWT token
- `requireAdmin` - Check admin role

### 4. **Models Enhancement**

Add these fields to `User.js` if not present:

```javascript
const userSchema = new mongoose.Schema({
  // ... existing fields
  isActive: { type: Boolean, default: true },
  isSuperAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // ... timestamps
}, { timestamps: true });
```

Add to `Review.js` if not present:

```javascript
const reviewSchema = new mongoose.Schema({
  // ... existing fields
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  // ... timestamps
}, { timestamps: true });
```

Add to `Notification.js` if not present:

```javascript
const notificationSchema = new mongoose.Schema({
  // ... existing fields
  readAt: Date,
  // ... timestamps
}, { timestamps: true });
```

### 5. **Create AdminToken Model** (for login tracking)

File: `src/models/AdminToken.js`

```javascript
const mongoose = require('mongoose');

const adminTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    ipAddress: String,
    userAgent: String,
    expiresAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminToken', adminTokenSchema);
```

---

## 🔌 Integration Steps

### Step 1: Update Main Admin Routes File

File: `src/routes/v1/admin/index.js` (Already Updated ✓)

The file now includes all new route handlers.

### Step 2: Start Server

```bash
npm start
```

### Step 3: Verify Routes

Test the health check:
```bash
curl http://localhost:3000/health
```

---

## 📊 1. Dashboard Analytics

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/analytics/summary` | GET | Key metrics overview |
| `/api/v1/admin/analytics/revenue` | GET | Revenue trends |
| `/api/v1/admin/analytics/top-products` | GET | Best selling products |
| `/api/v1/admin/analytics/order-status` | GET | Order status breakdown |
| `/api/v1/admin/analytics/user-growth` | GET | User signup trends |
| `/api/v1/admin/analytics/category-performance` | GET | Sales by category |
| `/api/v1/admin/analytics/recent-orders` | GET | Latest orders |
| `/api/v1/admin/analytics/low-stock` | GET | Low inventory items |

### Example Usage

```bash
# Get Dashboard Summary
curl -X GET "http://localhost:3000/api/v1/admin/analytics/summary" \
  -H "Authorization: Bearer <token>"

# Get Revenue for last 30 days
curl -X GET "http://localhost:3000/api/v1/admin/analytics/revenue?days=30" \
  -H "Authorization: Bearer <token>"
```

---

## 👥 2. Customers/Users Management

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/customers` | GET | List all customers |
| `/api/v1/admin/customers/stats` | GET | Customer statistics |
| `/api/v1/admin/customers/:customerId` | GET | Customer details |
| `/api/v1/admin/customers/:customerId/orders` | GET | Customer orders |
| `/api/v1/admin/customers/:customerId` | PATCH | Update customer |
| `/api/v1/admin/customers/:customerId/status` | PATCH | Block/unblock customer |
| `/api/v1/admin/customers/:customerId` | DELETE | Delete customer |

### Example Usage

```bash
# Get all customers
curl -X GET "http://localhost:3000/api/v1/admin/customers?page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# Get customer details
curl -X GET "http://localhost:3000/api/v1/admin/customers/userId123" \
  -H "Authorization: Bearer <token>"

# Update customer
curl -X PATCH "http://localhost:3000/api/v1/admin/customers/userId123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","is_verified":true}'
```

---

## ⭐ 3. Reviews Management

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/reviews` | GET | List all reviews |
| `/api/v1/admin/reviews/stats` | GET | Review statistics |
| `/api/v1/admin/reviews/:reviewId` | GET | Review details |
| `/api/v1/admin/reviews/product/:productId` | GET | Product reviews |
| `/api/v1/admin/reviews/:reviewId/approve` | PATCH | Approve review |
| `/api/v1/admin/reviews/:reviewId/reject` | PATCH | Reject review |
| `/api/v1/admin/reviews/:reviewId` | DELETE | Delete review |
| `/api/v1/admin/reviews/bulk/update-status` | PATCH | Bulk update |

### Example Usage

```bash
# Get pending reviews
curl -X GET "http://localhost:3000/api/v1/admin/reviews?status=pending" \
  -H "Authorization: Bearer <token>"

# Approve review
curl -X PATCH "http://localhost:3000/api/v1/admin/reviews/reviewId123/approve" \
  -H "Authorization: Bearer <token>"

# Reject review with reason
curl -X PATCH "http://localhost:3000/api/v1/admin/reviews/reviewId123/reject" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Inappropriate content"}'
```

---

## 🔔 4. Notifications Management

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/notifications-admin` | GET | List all notifications |
| `/api/v1/admin/notifications-admin/stats` | GET | Notification statistics |
| `/api/v1/admin/notifications-admin/user/:userId` | GET | User notifications |
| `/api/v1/admin/notifications-admin/send` | POST | Send notification |
| `/api/v1/admin/notifications-admin/send-bulk` | POST | Bulk notifications |
| `/api/v1/admin/notifications-admin/:notificationId/read` | PATCH | Mark as read |
| `/api/v1/admin/notifications-admin/user/:userId/read-all` | PATCH | Mark all read |
| `/api/v1/admin/notifications-admin/:notificationId` | DELETE | Delete notification |
| `/api/v1/admin/notifications-admin/clear/old` | DELETE | Clear old |

### Example Usage

```bash
# Get all notifications
curl -X GET "http://localhost:3000/api/v1/admin/notifications-admin?page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# Send notification to user
curl -X POST "http://localhost:3000/api/v1/admin/notifications-admin/send" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "userId123",
    "title": "Order Confirmed",
    "message": "Your order has been confirmed",
    "type": "ORDER_PLACED",
    "orderId": "orderId123"
  }'

# Send bulk notifications
curl -X POST "http://localhost:3000/api/v1/admin/notifications-admin/send-bulk" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user1", "user2", "user3"],
    "title": "Special Offer",
    "message": "Get 50% off on all items",
    "type": "PROMO"
  }'
```

---

## 🛡️ 5. Admin Users Management

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/admin-users` | GET | List all admins |
| `/api/v1/admin/admin-users/stats` | GET | Admin statistics |
| `/api/v1/admin/admin-users` | POST | Create new admin |
| `/api/v1/admin/admin-users/:adminId` | GET | Admin details |
| `/api/v1/admin/admin-users/:adminId/activity` | GET | Admin activity |
| `/api/v1/admin/admin-users/:adminId` | PATCH | Update admin |
| `/api/v1/admin/admin-users/:adminId/change-password` | POST | Change password |
| `/api/v1/admin/admin-users/:adminId/status` | PATCH | Toggle status |
| `/api/v1/admin/admin-users/:adminId` | DELETE | Delete admin |

### Example Usage

```bash
# Get all admin users
curl -X GET "http://localhost:3000/api/v1/admin/admin-users?page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# Create new admin
curl -X POST "http://localhost:3000/api/v1/admin/admin-users" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Admin",
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'

# Change admin password
curl -X POST "http://localhost:3000/api/v1/admin/admin-users/adminId123/change-password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "OldPassword123!",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }'
```

---

## 📚 Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `admin_dashboard_collection.json`
4. Update the `baseUrl` and `adminAccessToken` variables

### Set Environment Variables

```json
{
  "baseUrl": "http://localhost:3000",
  "adminAccessToken": "your-jwt-token-here"
}
```

---

## 🔐 Authentication Flow

### 1. Admin Login
```bash
POST /api/v1/admin/auth/login
{
  "email": "admin@example.com",
  "password": "admin-password"
}
```

Response:
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": "userId123",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 2. Use Access Token
```bash
Authorization: Bearer <accessToken>
```

---

## 🎯 Best Practices

### 1. **Pagination**
Always use pagination for list endpoints:
```
?page=1&limit=10
```

### 2. **Search**
Use search parameter for filtering:
```
?search=john&page=1&limit=10
```

### 3. **Date Range Queries**
Specify days for analytics:
```
?days=30
```

### 4. **Error Handling**
All errors follow standard format:
```json
{
  "success": false,
  "message": "Error description"
}
```

### 5. **Rate Limiting** (Optional - Can be added)
Implement rate limiting middleware for production:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/v1/admin/', limiter);
```

---

## 🔧 Troubleshooting

### Issue: "Unauthorized" Error
**Solution:** Ensure JWT token is valid and admin role is set

### Issue: "Cannot GET /api/v1/admin/analytics/summary"
**Solution:** Check if routes are properly imported in `src/routes/v1/admin/index.js`

### Issue: Database Connection Error
**Solution:** Verify MongoDB connection string and that server is running

### Issue: "Customer not found"
**Solution:** Verify the customerId is a valid MongoDB ObjectId

---

## 📋 Checklist for Complete Setup

- [ ] Install all dependencies
- [ ] Ensure database is connected
- [ ] Create/Update models with new fields
- [ ] Copy all controller files to `src/controllers/admin/`
- [ ] Copy all route files to `src/routes/v1/admin/`
- [ ] Update admin routes index file
- [ ] Test health endpoint
- [ ] Test admin login
- [ ] Import Postman collection
- [ ] Set environment variables
- [ ] Test each module's endpoints

---

## 📞 Support

For issues or questions:
1. Check the API documentation: `ADMIN_API_DOCUMENTATION.md`
2. Review controller files for implementation details
3. Check Postman collection for example requests
4. Verify database models have required fields

---

## 🎁 Bonus Features (Optional Enhancements)

### 1. **Activity Logging**
Track admin actions for audit trail:
```javascript
const ActivityLog = require('../models/ActivityLog');
await ActivityLog.create({
  adminId, action, details, timestamp
});
```

### 2. **Email Notifications**
Send emails when important events occur:
```javascript
const nodemailer = require('nodemailer');
// Send emails for reviews, orders, etc.
```

### 3. **CSV Export**
Export reports to CSV:
```javascript
const json2csv = require('json2csv');
// Export orders, customers, reviews
```

### 4. **Advanced Analytics**
Add more complex metrics:
```javascript
// Cohort analysis
// Customer lifetime value
// Churn prediction
```

### 5. **WebSocket Notifications** (Real-time)
```javascript
const io = require('socket.io')(server);
io.emit('newOrder', order);
```

---

## 📄 Files Created

```
✅ src/controllers/admin/analytics.controller.js
✅ src/controllers/admin/customers.controller.js
✅ src/controllers/admin/reviews.controller.js
✅ src/controllers/admin/notifications.controller.js
✅ src/controllers/admin/admin-users.controller.js

✅ src/routes/v1/admin/analytics.routes.js
✅ src/routes/v1/admin/customers.routes.js
✅ src/routes/v1/admin/reviews.routes.js
✅ src/routes/v1/admin/notifications-admin.routes.js
✅ src/routes/v1/admin/admin-users.routes.js

✅ ADMIN_API_DOCUMENTATION.md
✅ admin_dashboard_collection.json
✅ ADMIN_DASHBOARD_SETUP_GUIDE.md
```

---

## 🎉 You're All Set!

Your admin dashboard backend is now ready to use. Start your server and begin testing with the Postman collection!

```bash
npm start
```

Visit: `http://localhost:3000/api/v1/admin/analytics/summary`

Happy coding! 🚀
