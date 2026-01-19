# Advanced Features Documentation

ระบบตำรวจ Preview City ถูกออกแบบให้เป็น **Advanced System** ด้วย features ครบถ้วนและสมบูรณ์

## 🚀 Advanced Features ที่มี

### 1. MongoDB Models แบบ Advanced

สร้าง Models ครบถ้วนสำหรับทุก feature พร้อม:
- ✅ **Indexes** สำหรับ query performance
- ✅ **Validation** และ constraints
- ✅ **Timestamps** อัตโนมัติ
- ✅ **Relationships** ระหว่าง collections
- ✅ **Virtual fields** และ methods
- ✅ **Pre/post hooks** สำหรับ business logic

#### Models ที่สร้างแล้ว:

1. **WithdrawItem** - เบิกของในตู้
   - Status tracking (pending/approved/rejected)
   - Approval workflow
   - Indexed fields สำหรับ performance

2. **TimeTracking** - ลงเวลาพี่เลี้ยง
   - Duration calculation
   - Active/completed status
   - Date-based queries

3. **ReportCase** - แจ้งแคส
   - Auto-increment case number
   - Priority levels
   - Status tracking

4. **Story** - สตอรี่
   - Image storage
   - Likes system
   - Views tracking
   - Expiration support

5. **ReportCase** - แจ้งแคส
   - Priority system
   - Assignment workflow
   - Resolution tracking
   - Attachments support

6. **Blacklist** - แบล็คลิส
   - Category classification
   - Severity levels
   - Expiration dates
   - Active/inactive status

7. **Discipline** - โทษวินัยตำรวจ
   - Penalty types
   - Appeal system
   - Status workflow
   - Attachment support

8. **Suggestion** - เสนอความคิดเห็น
   - Likes system
   - Status workflow
   - Review system
   - Anonymous option

9. **Leave** - แจ้งลา
   - Leave types
   - Duration calculation
   - Approval workflow
   - Date range validation

10. **Cash** - แจ้งแคช
    - Category classification
    - Status tracking
    - Receipt upload

11. **Bonus** - แจ้งเหม๋อ
    - Bonus types
    - Status workflow
    - Payment tracking

12. **Notification** - การแจ้งเตือน
    - Multiple types (info/success/warning/error)
    - Priority levels
    - Read/unread tracking
    - Expiration support

### 2. Advanced API System

#### API Helpers (`lib/api-helpers.ts`)

- ✅ **Authentication helpers** - `requireAuth`, `requireAdmin`
- ✅ **Error handling** - `handleApiError` พร้อม validation
- ✅ **Query parsing** - Pagination, search, filter, sort
- ✅ **Type-safe** interfaces

#### API Routes Structure

```
app/api/
├── auth/              # Authentication
├── admin/             # Admin endpoints
├── withdraw-items/    # CRUD operations
├── time-tracking/     # (to be created)
├── report-case/       # (to be created)
├── stories/           # (to be created)
├── blacklist/         # (to be created)
├── discipline/        # (to be created)
├── suggestions/       # (to be created)
├── leave/             # (to be created)
├── cash/              # (to be created)
├── bonus/             # (to be created)
├── notifications/     # (to be created)
└── upload/            # Image upload
```

#### Features:

- ✅ **Pagination** - Page-based pagination with metadata
- ✅ **Search** - Full-text search across fields
- ✅ **Filtering** - Status, category, date range filters
- ✅ **Sorting** - Custom sort fields and directions
- ✅ **Role-based access** - Officers see only their data
- ✅ **Google Sheets backup** - Automatic backup on create/update
- ✅ **Discord notifications** - Real-time webhook notifications
- ✅ **Error handling** - Comprehensive error responses

### 3. Image Upload System

#### Features:

- ✅ **File validation** - Type and size checks
- ✅ **Unique filenames** - UUID-based naming
- ✅ **Folder organization** - Categorized storage
- ✅ **Path management** - URL generation
- ✅ **Error handling** - Detailed error messages

#### API Endpoint:

```
POST /api/upload/image?folder=stories
```

### 4. Google Sheets Integration

- ✅ **Automatic backup** - Sync on data changes
- ✅ **Credentials management** - JSON file-based
- ✅ **Error handling** - Fallback to MongoDB
- ✅ **Sheet creation** - Auto-create sheets if missing

### 5. Discord Webhook Integration

- ✅ **Real-time notifications** - Event-based alerts
- ✅ **Rich embeds** - Color-coded messages
- ✅ **Error handling** - Graceful failures

### 6. Advanced Error Handling

- ✅ **Validation errors** - Detailed field-level errors
- ✅ **MongoDB errors** - Duplicate key detection
- ✅ **HTTP status codes** - Proper status mapping
- ✅ **Error logging** - Console logging for debugging

### 7. Performance Optimizations

- ✅ **Database indexes** - Optimized queries
- ✅ **Parallel queries** - Promise.all for concurrent operations
- ✅ **Lean queries** - Minimal data transfer
- ✅ **Connection pooling** - MongoDB connection reuse

## 📋 Next Steps

### ต้องสร้าง API Routes สำหรับ Features อื่นๆ

Pattern สำหรับสร้าง API route:

```typescript
// app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FeatureModel } from '@/models/Feature';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);
    
    const query: any = {};
    // Add filters...
    
    const [data, total] = await Promise.all([
      FeatureModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      FeatureModel.countDocuments(query),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
```

### Features ที่ต้องอัปเดต Frontend

หน้าทั้งหมดต้องอัปเดตให้:
- ✅ ใช้ API routes แทน local state
- ✅ เพิ่ม pagination component
- ✅ เพิ่ม search/filter UI
- ✅ เพิ่ม loading states
- ✅ เพิ่ม error handling
- ✅ Real-time updates

## 🎯 Advanced Features Checklist

- [x] MongoDB Models พร้อม indexes
- [x] API Helpers system
- [x] Image upload system
- [x] Google Sheets integration
- [x] Discord webhook integration
- [x] Error handling system
- [x] Authentication middleware
- [ ] Complete API routes (บาง routes)
- [ ] Advanced UI components (DataTable, Pagination, Search)
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] Export functions (Excel/PDF)
- [ ] Advanced search filters
- [ ] Bulk operations

## 💡 Usage Examples

### Query with Pagination

```
GET /api/withdraw-items?page=1&limit=10&search=อุปกรณ์&status=approved&sort=-createdAt
```

### Create with Backup

```typescript
const response = await fetch('/api/withdraw-items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ itemName: 'อุปกรณ์', quantity: 10 }),
});
```

ระบบพร้อมสำหรับการขยายเพิ่มเติม!
