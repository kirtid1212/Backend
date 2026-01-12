# Address API Documentation

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Endpoints

### 1. GET /api/addresses
**Purpose:** Fetch all addresses of logged-in user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "full_name": "John Doe",
      "phone": "9876543210",
      "address_line1": "123 Main St",
      "address_line2": "Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India",
      "is_default": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 2. POST /api/addresses
**Purpose:** Create new address

**Request Body:**
```json
{
  "full_name": "John Doe",
  "phone": "9876543210",
  "address_line1": "123 Main St",
  "address_line2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "is_default": false
}
```

### 3. PUT /api/addresses/:id
**Purpose:** Update existing address

**Request Body:** Same as POST

### 4. DELETE /api/addresses/:id
**Purpose:** Delete address

### 5. PUT /api/addresses/:id/set-default
**Purpose:** Set address as default

## Validation Rules
- full_name: Min 3 characters
- phone: Exactly 10 digits
- pincode: Exactly 6 digits
- address_line1, city, state: Required
- Max 5 addresses per user

## Security Features
- JWT authentication
- Rate limiting (5 requests/minute for creation)
- Address ownership validation
- Input sanitization
- Transaction-safe default address updates