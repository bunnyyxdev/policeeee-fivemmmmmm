# ภาพรวมระบบตำรวจ Preview City

เอกสารอธิบายระบบทั้งหมดของระบบตำรวจ Preview City

## 🎯 ภาพรวม

ระบบตำรวจ Preview City เป็นระบบจัดการสำหรับตำรวจที่ออกแบบมาเพื่ออำนวยความสะดวกในการทำงานประจำวัน มี UI/UX ที่ทันสมัยและใช้งานง่าย พร้อมฟีเจอร์ครบถ้วนและ advanced features

---

## 🏗️ สถาปัตยกรรมระบบ

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **API**: Next.js API Routes
- **Database**: MongoDB (primary) + Google Sheets (backup)
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcryptjs (12 rounds)

### Integrations
- **Google Sheets API**: Automatic backup และ fallback
- **Discord Webhook**: Real-time notifications
- **File Storage**: Local file system (images)

---

## 📊 โครงสร้างข้อมูล (Database Models)

### User Model
- **username**: ชื่อผู้ใช้ (unique, indexed)
- **password**: รหัสผ่าน (hashed)
- **name**: ชื่อ-นามสกุล
- **policeRank**: ยศตำรวจ (optional)
- **role**: บทบาท (officer/admin)
- **createdAt/updatedAt**: Timestamps

### Feature Models (12 Models)

1. **WithdrawItem** - เบิกของในตู้
2. **TimeTracking** - ลงเวลาพี่เลี้ยง
3. **ReportCase** - แจ้งแคส
4. **Story** - สตอรี่
5. **Blacklist** - แบล็คลิส
6. **Discipline** - โทษวินัยตำรวจ
7. **Suggestion** - เสนอความคิดเห็น
8. **Leave** - แจ้งลา
9. **Cash** - แจ้งแคช
10. **Bonus** - แจ้งเหม๋อ
11. **Notification** - การแจ้งเตือน
12. **StoryLog** - บันทึกสตอรี่

ทุก model มี:
- ✅ Indexes สำหรับ performance
- ✅ Validation และ constraints
- ✅ Timestamps (createdAt/updatedAt)
- ✅ Relationships ระหว่าง collections

---

## 🔐 ระบบความปลอดภัย

### Authentication
- **JWT Token**: ใช้สำหรับ authentication
- **Token Expiry**: 7 วัน
- **Password Hashing**: bcryptjs (12 rounds)
- **Protected Routes**: ต้อง login ก่อนเข้าถึง

### Authorization
- **Role-based Access**: แยกสิทธิ์ Admin และ Officer
- **User Isolation**: ตำรวจเห็นเฉพาะข้อมูลของตัวเอง (Admin เห็นทั้งหมด)
- **API Protection**: ทุก API route ต้องมี token

### Data Protection
- **Password Masking**: แสดงเป็น •••• ใน input field
- **Show/Hide Toggle**: สามารถแสดง/ซ่อน password ได้
- **Environment Variables**: เก็บข้อมูลสำคัญใน .env
- **Credentials Protection**: credentials.json ถูก ignore โดย git

---

## 🎨 UI/UX Features

### Components

#### 1. Sidebar Navigation
- ✅ Fixed sidebar พร้อม menu items
- ✅ Submenu support (dropdown)
- ✅ Active state highlighting
- ✅ Icon support
- ✅ Logout button

#### 2. Button Component
- ✅ 5 variants: primary, success, warning, danger, secondary
- ✅ Loading state
- ✅ Description text
- ✅ Disabled state

#### 3. Alert Component
- ✅ 4 types: success, warning, error, info
- ✅ Icon support
- ✅ Close button
- ✅ Title และ message

#### 4. PasswordInput Component
- ✅ Password masking (••••)
- ✅ Show/hide toggle
- ✅ Icon support
- ✅ Auto-complete protection

#### 5. NotificationCenter Component
- ✅ Bell icon พร้อม unread badge
- ✅ Dropdown list
- ✅ Unread/Read separation
- ✅ Mark as read functionality

### Design System

#### Colors (Primary)
- **Primary 50-900**: Blue scale
- **Success**: Green (#2ecc71)
- **Warning**: Yellow/Orange (#f39c12)
- **Error**: Red (#e74c3c)
- **Info**: Blue (#3498db)

#### Typography
- **Font**: Noto Sans Thai (supports Thai)
- **Sizes**: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

---

## 🔔 ระบบแจ้งเตือน

### Browser Notifications
- Native Browser API
- Permission management
- Rich notifications (icon, image, badge)
- Auto-close หรือ requireInteraction
- Click handling

### Toast Notifications
- React Hot Toast
- 4 types: info, success, warning, error
- Custom duration
- Position control (top-right)

### Real-time Updates
- Polling system (ทุก 30 วินาที)
- Auto-fetch เมื่อมีผู้ใช้
- Unread count tracking

---

## 📝 Google Sheets Integration

### Template System

ทุก feature มี template ที่กำหนดไว้:

#### Template Features
- ✅ Auto-initialization (สร้าง sheet และ headers อัตโนมัติ)
- ✅ Header formatting (bold, background color, frozen)
- ✅ Field mapping (แปลงข้อมูลจาก MongoDB เป็น Google Sheets format)
- ✅ Date/time formatting (ภาษาไทย)
- ✅ Boolean formatting (ใช่/ไม่)

#### Templates (12 Templates)
1. เบิกของในตู้
2. ลงเวลาพี่เลี้ยง
3. แจ้งแคส
4. สตอรี่
5. แบล็คลิส
6. โทษวินัยตำรวจ
7. เสนอความคิดเห็น
8. แจ้งลา
9. แจ้งแคช
10. แจ้งเหม๋อ
11. การแจ้งเตือน
12. บันทึกสตอรี่

### Backup & Fallback

- **Primary**: MongoDB
- **Backup/Fallback**: Google Sheets
- **Auto-sync**: บันทึกไปยัง Google Sheets ทุกครั้งที่มีการสร้าง/อัปเดตข้อมูล

---

## 🔄 API Routes Structure

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/[id]` - Delete user
- `POST /api/admin/initialize-sheets` - Initialize Google Sheets templates

### Features (CRUD Operations)
- `GET /api/[feature]` - List (with pagination, search, filter, sort)
- `POST /api/[feature]` - Create
- `GET /api/[feature]/[id]` - Get one
- `PUT /api/[feature]/[id]` - Update
- `DELETE /api/[feature]/[id]` - Delete

### Upload
- `POST /api/upload/image` - Upload image

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/[id]/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### API Features

- ✅ **Pagination**: Page-based with metadata
- ✅ **Search**: Full-text search across fields
- ✅ **Filtering**: Status, category, date range
- ✅ **Sorting**: Custom sort fields and directions
- ✅ **Role-based Access**: Officers see only their data
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Google Sheets Backup**: Automatic backup on create/update
- ✅ **Discord Notifications**: Real-time webhook notifications

---

## 📱 Pages Structure

### Public Pages
- `/` - Home (redirects to /login)
- `/login` - Login page

### Officer Pages
- `/dashboard` - Dashboard
- `/dashboard/withdraw-items` - เบิกของในตู้
- `/dashboard/time-tracking` - ลงเวลาพี่เลี้ยง
- `/dashboard/report-case` - แจ้งแคส
- `/dashboard/story` - สตอรี่
- `/dashboard/blacklist` - แบล็คลิส
- `/dashboard/discipline` - โทษวินัยตำรวจ
- `/dashboard/suggestions` - เสนอความคิดเห็น

### Others Submenu
- `/dashboard/others/leave` - แจ้งลา
- `/dashboard/others/announcements` - สำหรับคำประกาศตำรวจ

### Admin Pages
- `/dashboard/admin` - Admin Dashboard
- `/dashboard/admin/users` - จัดการผู้ใช้
- `/dashboard/admin/users/create` - สร้างผู้ใช้
- `/dashboard/admin/driver-license` - ออกใบอนุญาติขับฮอ

---

## 🚀 Advanced Features

### 1. Real-time Updates
- ✅ Polling system สำหรับ notifications
- ✅ Auto-refresh data

### 2. Image Upload System
- ✅ File validation (type, size)
- ✅ Unique filename generation (UUID)
- ✅ Folder organization
- ✅ Image preview

### 3. Search & Filter
- ✅ Full-text search
- ✅ Status filter
- ✅ Category filter
- ✅ Date range filter

### 4. Pagination
- ✅ Page-based pagination
- ✅ Configurable page size
- ✅ Pagination metadata

### 5. Data Export (Planned)
- ✅ Export to Excel
- ✅ Export to PDF

---

## 🔧 Configuration

### Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/police_web_v1

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Discord Webhooks (can use multiple webhooks per type, separated by commas)
# General webhook (fallback for all types if type-specific is not set)
POLICE_WEBHOOK_URL=https://discord.com/api/webhooks/your-general-webhook-url
POLICE_WEBHOOK_GENERAL=https://discord.com/api/webhooks/your-general-webhook-url

# Type-specific webhooks
POLICE_WEBHOOK_NOTIFICATIONS=https://discord.com/api/webhooks/your-notifications-webhook-url
POLICE_WEBHOOK_WITHDRAWALS=https://discord.com/api/webhooks/your-withdrawals-webhook-url
POLICE_WEBHOOK_ADMIN=https://discord.com/api/webhooks/your-admin-webhook-url
POLICE_WEBHOOK_ACTIVITIES=https://discord.com/api/webhooks/your-activities-webhook-url

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Admin Credentials
ADMIN_USERNAME=administrator
ADMIN_PASSWORD=bizcity#123456
```

### Google Sheets Credentials

ไฟล์ `credentials.json` ต้องอยู่ใน root directory:
- Type: Service Account
- Scopes: `https://www.googleapis.com/auth/spreadsheets`
- Shared to: Service Account email

---

## 📚 Documentation Files

1. **README.md** - เอกสารหลัก
2. **docs/POLICE_SYSTEM_GUIDE.md** - คู่มือระบบตำรวจ
3. **docs/SYSTEM_OVERVIEW.md** - ภาพรวมระบบ (ไฟล์นี้)
4. **docs/ADVANCED_FEATURES.md** - ฟีเจอร์ขั้นสูง
5. **docs/NOTIFICATION_SYSTEM.md** - ระบบแจ้งเตือน
6. **docs/GOOGLE_SHEETS_TEMPLATES.md** - Google Sheets Templates
7. **docs/API_DOCUMENTATION.md** - API Documentation
8. **docs/DEPLOYMENT.md** - การ Deploy
9. **docs/GOOGLE_SHEETS_SETUP.md** - การตั้งค่า Google Sheets

---

## 🎯 System Goals

### สำหรับตำรวจ
- ✅ บันทึกและจัดการข้อมูลการทำงาน
- ✅ ติดตามและรายงานข้อมูลต่างๆ
- ✅ แชร์ข้อมูลและสื่อสารภายในทีม
- ✅ รับการแจ้งเตือนแบบ real-time

### สำหรับผู้ดูแลระบบ
- ✅ จัดการผู้ใช้
- ✅ ดูสถิติและรายงาน
- ✅ ควบคุมและดูแลระบบ

---

## 📈 Performance

### Database
- ✅ Indexes สำหรับ query performance
- ✅ Connection pooling
- ✅ Lean queries

### Frontend
- ✅ Next.js Image optimization
- ✅ Code splitting
- ✅ Lazy loading

### Backend
- ✅ Efficient API routes
- ✅ Parallel queries (Promise.all)
- ✅ Caching (MongoDB connection)

---

## 🔒 Security Best Practices

1. ✅ **Password Hashing**: bcryptjs (12 rounds)
2. ✅ **JWT Token**: Signed และ expired
3. ✅ **Protected Routes**: ต้อง login
4. ✅ **Role-based Access**: แยกสิทธิ์
5. ✅ **Input Validation**: ทั้ง frontend และ backend
6. ✅ **Error Handling**: ไม่ expose sensitive information
7. ✅ **Environment Variables**: เก็บ secrets ใน .env
8. ✅ **Credentials Protection**: ไม่ commit credentials

---

## 🐛 Troubleshooting

### Login Issues
- ตรวจสอบ username/password
- ตรวจสอบ JWT_SECRET
- ตรวจสอบ MongoDB connection

### Google Sheets Issues
- ตรวจสอบ credentials.json
- ตรวจสอบ Spreadsheet ID
- ตรวจสอบ permissions (Service Account)

### Notification Issues
- ตรวจสอบ browser permissions
- ตรวจสอบ POLICE_WEBHOOK_URL
- ตรวจสอบ network connection

---

## 📞 Support

สำหรับคำถามหรือปัญหา:
1. ตรวจสอบ Documentation ใน `/docs` folder
2. ตรวจสอบ FAQ ใน `docs/POLICE_SYSTEM_GUIDE.md`
3. ติดต่อ Admin ผ่านระบบ

---

**อัปเดตล่าสุด**: 2024  
**เวอร์ชัน**: 1.0.0  
**ระบบตำรวจ Preview City** - Advanced Police Management System
