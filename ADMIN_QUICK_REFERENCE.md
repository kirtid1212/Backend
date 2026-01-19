# Admin Dashboard Backend - Quick Reference

## 🚀 Quick Start

```bash
# 1. Start your server
npm start

# 2. Admin login
curl -X POST http://localhost:3000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin-password"}'

# 3. Copy the accessToken and use in all requests
Authorization: Bearer <accessToken>
```

---

## 📊 Dashboard Analytics

### Summary Dashboard
```bash
GET /api/v1/admin/analytics/summary
```
Response includes: totalOrders, totalUsers, todayRevenue, etc.

### Revenue Trends (Last 30 Days)
```bash
GET /api/v1/admin/analytics/revenue?days=30
```

### Top Selling Products
```bash
GET /api/v1/admin/analytics/top-products?limit=10
```

### Order Status Breakdown
```bash
GET /api/v1/admin/analytics/order-status
```

### User Signup Trends
```bash
GET /api/v1/admin/analytics/user-growth?days=30
```

### Category Performance
```bash
GET /api/v1/admin/analytics/category-performance
```

### Recent Orders
```bash
GET /api/v1/admin/analytics/recent-orders?limit=5
```

### Low Stock Products
```bash
GET /api/v1/admin/analytics/low-stock?threshold=10
```

---

## 👥 Customers Management

### List All Customers
```bash
GET /api/v1/admin/customers?page=1&limit=10&search=john
```

### Customer Statistics
```bash
GET /api/v1/admin/customers/stats
```

### Get Customer Details
```bash
GET /api/v1/admin/customers/:customerId
```

### Get Customer Orders
```bash
GET /api/v1/admin/customers/:customerId/orders
```

### Update Customer Info
```bash
PATCH /api/v1/admin/customers/:customerId
{
  "name": "John Doe",
  "phone": "+91-9876543210",
  "is_verified": true
}
```

### Block/Unblock Customer
```bash
PATCH /api/v1/admin/customers/:customerId/status
{
  "isActive": false
}
```

### Delete Customer
```bash
DELETE /api/v1/admin/customers/:customerId
```

---

## ⭐ Reviews Management

### List All Reviews
```bash
GET /api/v1/admin/reviews?page=1&limit=10&status=pending
```

Query Parameters:
- `page`: Page number
- `limit`: Items per page
- `status`: pending, approved, rejected
- `rating`: 1-5

### Review Statistics
```bash
GET /api/v1/admin/reviews/stats
```

### Get Review Details
```bash
GET /api/v1/admin/reviews/:reviewId
```

### Get Product Reviews
```bash
GET /api/v1/admin/reviews/product/:productId?page=1&limit=10
```

### Approve Review
```bash
PATCH /api/v1/admin/reviews/:reviewId/approve
```

### Reject Review
```bash
PATCH /api/v1/admin/reviews/:reviewId/reject
{
  "reason": "Inappropriate content"
}
```

### Delete Review
```bash
DELETE /api/v1/admin/reviews/:reviewId
```

### Bulk Update Reviews
```bash
PATCH /api/v1/admin/reviews/bulk/update-status
{
  "reviewIds": ["id1", "id2", "id3"],
  "status": "approved"
}
```

---

## 🔔 Notifications Management

### List All Notifications
```bash
GET /api/v1/admin/notifications-admin?page=1&limit=10&type=ORDER_PLACED&isRead=false
```

### Notification Statistics
```bash
GET /api/v1/admin/notifications-admin/stats
```

### Get User Notifications
```bash
GET /api/v1/admin/notifications-admin/user/:userId?page=1&limit=10
```

### Send Single Notification
```bash
POST /api/v1/admin/notifications-admin/send
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
```bash
POST /api/v1/admin/notifications-admin/send-bulk
{
  "userIds": ["user1", "user2", "user3"],
  "title": "Special Offer",
  "message": "Get 50% off",
  "type": "PROMO"
}
```

### Mark Notification as Read
```bash
PATCH /api/v1/admin/notifications-admin/:notificationId/read
```

### Mark All as Read
```bash
PATCH /api/v1/admin/notifications-admin/user/:userId/read-all
{
  "userId": "user-id"
}
```

### Delete Notification
```bash
DELETE /api/v1/admin/notifications-admin/:notificationId
```

### Clear Old Notifications
```bash
DELETE /api/v1/admin/notifications-admin/clear/old?days=30
```

---

## 🛡️ Admin Users Management

### List All Admins
```bash
GET /api/v1/admin/admin-users?page=1&limit=10&search=admin
```

### Admin Statistics
```bash
GET /api/v1/admin/admin-users/stats
```

### Create New Admin
```bash
POST /api/v1/admin/admin-users
{
  "name": "New Admin",
  "email": "newadmin@example.com",
  "password": "SecurePassword123!"
}
```

### Get Admin Details
```bash
GET /api/v1/admin/admin-users/:adminId
```

### Get Admin Activity/Login History
```bash
GET /api/v1/admin/admin-users/:adminId/activity
```

### Update Admin Info
```bash
PATCH /api/v1/admin/admin-users/:adminId
{
  "name": "Updated Name",
  "phone": "+91-9876543210",
  "is_verified": true
}
```

### Change Admin Password
```bash
POST /api/v1/admin/admin-users/:adminId/change-password
{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### Activate/Deactivate Admin
```bash
PATCH /api/v1/admin/admin-users/:adminId/status
{
  "isActive": false
}
```

### Delete Admin
```bash
DELETE /api/v1/admin/admin-users/:adminId
```

---

## 🎯 Common Patterns

### Standard Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 50,
    "limit": 10
  }
}
```

---

## 🔑 Authentication Headers

All requests (except login) require:
```
Authorization: Bearer <accessToken>
```

Example:
```bash
curl -X GET http://localhost:3000/api/v1/admin/analytics/summary \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📋 HTTP Methods

- `GET` - Retrieve data
- `POST` - Create new data
- `PATCH` - Update existing data
- `DELETE` - Remove data

---

## 🧪 Testing Endpoints

### Using cURL
```bash
# GET
curl -X GET "http://localhost:3000/api/v1/admin/analytics/summary" \
  -H "Authorization: Bearer TOKEN"

# POST
curl -X POST "http://localhost:3000/api/v1/admin/notifications-admin/send" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"123","title":"Test","message":"Test","type":"TEST"}'

# PATCH
curl -X PATCH "http://localhost:3000/api/v1/admin/customers/:customerId" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'

# DELETE
curl -X DELETE "http://localhost:3000/api/v1/admin/customers/:customerId" \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman
1. Import `admin_dashboard_collection.json`
2. Set `adminAccessToken` variable
3. Click Send on any request

---

## 🐛 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Unauthorized" | Check if token is valid and not expired |
| "Forbidden" | Verify user has admin role |
| "Not found" | Check if ID is correct |
| "Bad request" | Verify request body format |
| "Duplicate key" | Check for unique field conflicts |

---

## 📞 Available Notification Types

```javascript
'ORDER_PLACED'
'PAYMENT_SUCCESS'
'DELIVERY_SUCCESS'
'ORDER_CANCELLED'
'REFUND_INITIATED'
'SHIPMENT_UPDATE'
'PROMO'
'ALERT'
```

---

## 🔄 Pagination Examples

### First Page
```
?page=1&limit=10
```

### Second Page
```
?page=2&limit=10
```

### Custom Limit
```
?page=1&limit=50
```

---

## 🔍 Search Examples

### Search by Name
```
?search=john
```

### Search by Email
```
?search=john@example.com
```

### With Pagination
```
?search=john&page=1&limit=10
```

---

## 📊 Analytics Date Range Examples

### Last 7 Days
```
?days=7
```

### Last 30 Days (default)
```
?days=30
```

### Last 90 Days
```
?days=90
```

### Last Year
```
?days=365
```

---

## 💾 Sample Request Data

### Create Admin
```json
{
  "name": "John Admin",
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

### Send Notification
```json
{
  "userId": "userId123",
  "title": "Order Confirmed",
  "message": "Your order has been confirmed",
  "type": "ORDER_PLACED"
}
```

### Update Customer
```json
{
  "name": "Jane Doe",
  "phone": "+91-9876543210",
  "is_verified": true
}
```

### Reject Review
```json
{
  "reason": "Inappropriate language used"
}
```

---

## 🚀 Performance Tips

1. **Use Pagination** - Always paginate large datasets
2. **Filter Data** - Use search/status filters when available
3. **Limit Results** - Use appropriate limit values
4. **Cache Results** - Cache frequently accessed data
5. **Optimize Queries** - Use indexes on searchable fields

---

## 📚 Documentation Files

- `ADMIN_API_DOCUMENTATION.md` - Detailed API reference
- `ADMIN_DASHBOARD_SETUP_GUIDE.md` - Complete setup guide
- `admin_dashboard_collection.json` - Postman collection
- `ADMIN_QUICK_REFERENCE.md` - This file

---

## 🎁 Next Steps

1. ✅ Start the server
2. ✅ Test authentication
3. ✅ Explore each module with provided examples
4. ✅ Import Postman collection for testing
5. ✅ Integrate with frontend dashboard

---

**Last Updated:** January 2026
**Version:** 1.0
