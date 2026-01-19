# API Documentation

เอกสาร API สำหรับระบบตำรวจ Preview City

## Authentication Endpoints

### POST `/api/auth/login`

เข้าสู่ระบบ

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (Success):**
```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "username": "string",
    "name": "string",
    "role": "officer" | "admin"
  }
}
```

**Response (Error):**
```json
{
  "error": "error message"
}
```

### GET `/api/auth/me`

ดึงข้อมูลผู้ใช้ปัจจุบัน (ต้องมี token)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "username": "string",
    "name": "string",
    "email": "string",
    "role": "officer" | "admin"
  }
}
```

## Admin Endpoints

### GET `/api/admin/stats`

ดึงสถิติผู้ใช้ (Admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "totalUsers": 10,
  "officers": 8,
  "admins": 2
}
```

### GET `/api/admin/users`

ดึงรายการผู้ใช้ทั้งหมด (Admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "users": [
    {
      "_id": "user-id",
      "username": "string",
      "name": "string",
      "email": "string",
      "role": "officer" | "admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/admin/users`

สร้างผู้ใช้ใหม่ (Admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string (optional)",
  "role": "officer" | "admin"
}
```

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "username": "string",
    "name": "string",
    "email": "string",
    "role": "officer" | "admin"
  }
}
```

### DELETE `/api/admin/users/[id]`

ลบผู้ใช้ (Admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

## Error Codes

- `400` - Bad Request (ข้อมูลไม่ครบหรือไม่ถูกต้อง)
- `401` - Unauthorized (ไม่มี token หรือ token หมดอายุ)
- `403` - Forbidden (ไม่มีสิทธิ์เข้าถึง)
- `404` - Not Found (ไม่พบข้อมูล)
- `500` - Internal Server Error (เกิดข้อผิดพลาดใน server)
