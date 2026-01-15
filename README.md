# Address API Documentation

## Authentication
All authenticated endpoints require a bearer access token in the header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Signup (users)
- `POST /api/v1/auth/signup`
- Body: `{ "name": "...", "email": "...", "password": "...", "confirmPassword": "..." }`
- The API hashes the password, ensures the email is unique, and returns access/refresh tokens on success.

### Login (users)
- `POST /api/v1/auth/login`
- Body: `{ "email": "...", "password": "..." }`
- On success you receive fresh access/refresh tokens containing the user payload.

### Token management
- `POST /api/v1/auth/refresh`: send `{ "refreshToken": "..." }` to rotate the refresh token.
- `POST /api/v1/auth/logout`: revokes all user refresh tokens (requires `Authorization` header).

### Admin login
- `POST /api/v1/admin/auth/login`
- Body: `{ "email": "<ADMIN_EMAIL>", "password": "<ADMIN_PASSWORD>" }`
- The login succeeds only if the request matches the credentials defined in `ADMIN_EMAIL`/`ADMIN_PASSWORD`. A corresponding admin user is created on first successful login and receives tokens just like a regular user.

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
