# Admin Dashboard API Documentation

## Overview
Complete backend APIs for Admin Dashboard featuring 5 main modules:
1. **Dashboard Analytics**
2. **Customers/Users Management**
3. **Reviews Management**
4. **Notifications Management**
5. **Admin Users Management**

---

## 📊 Dashboard Analytics
Base URL: `/api/v1/admin/analytics`

### Get Dashboard Summary
```
GET /api/v1/admin/analytics/summary
```
Returns key metrics for the dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 250,
    "totalUsers": 1500,
    "totalProducts": 320,
    "todayOrders": 12,
    "todayRevenue": 45000,
    "monthRevenue": 850000,
    "pendingOrders": 8,
    "averageRating": 4.5
  }
}
```

### Get Revenue Chart
```
GET /api/v1/admin/analytics/revenue?days=30
```
Returns revenue trends for the last N days.

**Query Parameters:**
- `days` (optional, default: 30): Number of days to retrieve

### Get Top Products
```
GET /api/v1/admin/analytics/top-products?limit=10
```
Returns best-selling products.

**Query Parameters:**
- `limit` (optional, default: 10): Number of products to retrieve

### Get Order Status Distribution
```
GET /api/v1/admin/analytics/order-status
```
Returns breakdown of orders by status.

### Get User Growth
```
GET /api/v1/admin/analytics/user-growth?days=30
```
Returns user signup trends.

**Query Parameters:**
- `days` (optional, default: 30): Number of days

### Get Category Performance
```
GET /api/v1/admin/analytics/category-performance
```
Returns sales metrics by category.

### Get Recent Orders
```
GET /api/v1/admin/analytics/recent-orders?limit=5
```
Returns latest orders for dashboard.

### Get Low Stock Products
```
GET /api/v1/admin/analytics/low-stock?threshold=10
```
Returns products with inventory below threshold.

---

## 👥 Customers/Users Management
Base URL: `/api/v1/admin/customers`

### Get All Customers
```
GET /api/v1/admin/customers?page=1&limit=10&search=john
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Records per page
- `search` (optional): Search by name, email, or phone

### Get Customer Details
```
GET /api/v1/admin/customers/:customerId
```

### Get Customer Orders
```
GET /api/v1/admin/customers/:customerId/orders
```

### Get Customer Statistics
```
GET /api/v1/admin/customers/stats
```
Returns overall customer metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 1500,
    "activeCustomers": 1200,
    "totalSpent": 5000000,
    "avgOrderValue": 20000,
    "topCustomers": [...]
  }
}
```

### Update Customer
```
PATCH /api/v1/admin/customers/:customerId
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+91-9876543210",
  "is_verified": true
}
```

### Toggle Customer Status
```
PATCH /api/v1/admin/customers/:customerId/status
Content-Type: application/json

{
  "isActive": false
}
```

### Delete Customer
```
DELETE /api/v1/admin/customers/:customerId
```

---

## ⭐ Reviews Management
Base URL: `/api/v1/admin/reviews`

### Get All Reviews
```
GET /api/v1/admin/reviews?page=1&limit=10&status=pending&rating=5
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Records per page
- `status` (optional): 'approved', 'pending', 'rejected'
- `rating` (optional): Filter by star rating (1-5)

### Get Review Details
```
GET /api/v1/admin/reviews/:reviewId
```

### Get Reviews Statistics
```
GET /api/v1/admin/reviews/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReviews": 450,
    "approvedReviews": 400,
    "pendingReviews": 40,
    "rejectedReviews": 10,
    "ratingDistribution": [...],
    "topRatedProducts": [...]
  }
}
```

### Get Product Reviews
```
GET /api/v1/admin/reviews/product/:productId?page=1&limit=10
```

### Approve Review
```
PATCH /api/v1/admin/reviews/:reviewId/approve
```

### Reject Review
```
PATCH /api/v1/admin/reviews/:reviewId/reject
Content-Type: application/json

{
  "reason": "Inappropriate content"
}
```

### Delete Review
```
DELETE /api/v1/admin/reviews/:reviewId
```

### Bulk Update Review Status
```
PATCH /api/v1/admin/reviews/bulk/update-status
Content-Type: application/json

{
  "reviewIds": ["id1", "id2", "id3"],
  "status": "approved"
}
```

---

## 🔔 Notifications Management
Base URL: `/api/v1/admin/notifications-admin`

### Get All Notifications
```
GET /api/v1/admin/notifications-admin?page=1&limit=10&type=ORDER_PLACED&isRead=false
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Records per page
- `type` (optional): Notification type
- `isRead` (optional): 'true' or 'false'

### Get User Notifications
```
GET /api/v1/admin/notifications-admin/user/:userId?page=1&limit=10
```

### Get Notification Statistics
```
GET /api/v1/admin/notifications-admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalNotifications": 5000,
    "readNotifications": 4500,
    "unreadNotifications": 500,
    "notificationsByType": [...],
    "notificationsByDate": [...]
  }
}
```

### Send Notification
```
POST /api/v1/admin/notifications-admin/send
Content-Type: application/json

{
  "userId": "user-id",
  "title": "Order Confirmed",
  "message": "Your order has been confirmed",
  "type": "ORDER_PLACED",
  "orderId": "order-id",
  "metadata": {
    "orderNumber": "ORD123",
    "amount": 5000
  }
}
```

### Send Bulk Notifications
```
POST /api/v1/admin/notifications-admin/send-bulk
Content-Type: application/json

{
  "userIds": ["user-id-1", "user-id-2"],
  "title": "Special Offer",
  "message": "Get 50% off on all items",
  "type": "PROMO",
  "metadata": {}
}
```

### Mark Notification as Read
```
PATCH /api/v1/admin/notifications-admin/:notificationId/read
```

### Mark All Notifications as Read
```
PATCH /api/v1/admin/notifications-admin/user/:userId/read-all
Content-Type: application/json

{
  "userId": "user-id"
}
```

### Delete Notification
```
DELETE /api/v1/admin/notifications-admin/:notificationId
```

### Clear Old Notifications
```
DELETE /api/v1/admin/notifications-admin/clear/old?days=30
```

---

## 🛡️ Admin Users Management
Base URL: `/api/v1/admin/admin-users`

### Get All Admin Users
```
GET /api/v1/admin/admin-users?page=1&limit=10&search=admin
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Records per page
- `search` (optional): Search by name or email

### Get Admin Statistics
```
GET /api/v1/admin/admin-users/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAdmins": 5,
    "activeAdmins": 4,
    "totalSuperAdmins": 1,
    "recentAdmins": [...]
  }
}
```

### Create New Admin
```
POST /api/v1/admin/admin-users
Content-Type: application/json

{
  "name": "John Admin",
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

### Get Admin Details
```
GET /api/v1/admin/admin-users/:adminId
```

### Get Admin Activity
```
GET /api/v1/admin/admin-users/:adminId/activity
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {...},
    "loginHistory": [...]
  }
}
```

### Update Admin
```
PATCH /api/v1/admin/admin-users/:adminId
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+91-9876543210",
  "is_verified": true
}
```

### Change Admin Password
```
POST /api/v1/admin/admin-users/:adminId/change-password
Content-Type: application/json

{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### Toggle Admin Status
```
PATCH /api/v1/admin/admin-users/:adminId/status
Content-Type: application/json

{
  "isActive": false
}
```

### Delete Admin
```
DELETE /api/v1/admin/admin-users/:adminId
```

---

## Authentication

All endpoints (except admin login) require:
- **Authorization Header**: `Bearer <accessToken>`
- **Admin Role**: User must have `role: 'admin'`

Example:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Server Error

---

## Postman Collection

A Postman collection is available at: `postman_collection_v1.json`

To import:
1. Open Postman
2. Click "Import"
3. Select the JSON file
4. Update base URL variable to your server

---

## Environment Variables

```
baseUrl=http://localhost:3000
adminEmail=admin@example.com
adminPassword=admin-password
```

---

## Notes

- All pagination defaults to page 1, limit 10
- Timestamps are in UTC (ISO 8601 format)
- All IDs are MongoDB ObjectIds
- Sensitive data (passwords) are not returned in responses
- Admin actions are logged (optional - implement logging middleware)

