# ระบบแจ้งเตือน (Notification System)

ระบบแจ้งเตือนแบบ Advanced ที่รองรับทั้ง Browser Notifications และ Toast Notifications

## ✨ Features

### 1. Browser Notifications (เด้งหน้าต่าง)
- ✅ **Native Browser API** - ใช้ Notification API ของ Browser
- ✅ **Permission Management** - จัดการสิทธิ์การแจ้งเตือน
- ✅ **Rich Notifications** - รองรับ icon, image, badge, actions
- ✅ **Auto-close** - ปิดอัตโนมัติหลัง 5 วินาที (หรือตาม requireInteraction)
- ✅ **Click Handling** - จัดการ click event และเปิด URL
- ✅ **Vibration** - รองรับการสั่นสำหรับแจ้งเตือนสำคัญ
- ✅ **Cross-browser Support** - ตรวจสอบ browser support

### 2. Toast Notifications (แจ้งเตือนในหน้าเว็บ)
- ✅ **React Hot Toast** - ใช้ react-hot-toast
- ✅ **Type-based Styling** - success, warning, error, info
- ✅ **Custom Duration** - ระยะเวลาตาม priority
- ✅ **Position Control** - กำหนดตำแหน่งแสดงผล

### 3. Real-time Updates
- ✅ **Polling System** - ตรวจสอบการแจ้งเตือนใหม่ทุก 30 วินาที
- ✅ **Auto-fetch** - ดึงข้อมูลอัตโนมัติเมื่อมีผู้ใช้
- ✅ **Unread Count** - นับจำนวนการแจ้งเตือนที่ยังไม่อ่าน
- ✅ **State Management** - จัดการ state อย่างมีประสิทธิภาพ

### 4. Notification Center UI
- ✅ **Dropdown Interface** - ดีไซน์เป็น dropdown
- ✅ **Unread/Read Separation** - แยกการแจ้งเตือนที่อ่านแล้ว/ยังไม่อ่าน
- ✅ **Mark as Read** - ทำเครื่องหมายว่าอ่านแล้ว (รายการ/ทั้งหมด)
- ✅ **Priority Badge** - แสดงความสำคัญ
- ✅ **Type Icons** - ไอคอนตามประเภท
- ✅ **Click to Open** - คลิกเพื่อเปิด action URL

## 📁 File Structure

```
lib/
├── notification-browser.ts    # Browser Notification Manager
└── notification-helper.ts     # Server-side notification helpers

hooks/
└── useNotifications.ts        # React hook สำหรับ notifications

components/
└── NotificationCenter.tsx     # Notification Center UI Component

app/api/notifications/
├── route.ts                   # GET, POST notifications
├── [id]/read/route.ts         # Mark notification as read
└── read-all/route.ts          # Mark all as read
```

## 🚀 Usage

### 1. เพิ่ม Notification Center ใน Layout

```tsx
import NotificationCenter from '@/components/NotificationCenter';

// ใน Layout component
<NotificationCenter userId={user._id} token={token} />
```

### 2. ใช้ Notification Hook

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    showNotification,
    markAsRead 
  } = useNotifications({ 
    userId: user._id, 
    token: token,
    autoFetch: true,
    interval: 30000 // 30 seconds
  });

  // Show custom notification
  showNotification(
    'หัวข้อ',
    'ข้อความ',
    'success', // type: info | success | warning | error
    {
      requireInteraction: true, // ไม่ปิดอัตโนมัติ
      vibrate: [200, 100, 200],
    }
  );
}
```

### 3. สร้าง Notification (Server-side)

```typescript
import { createNotification } from '@/lib/notification-helper';

await createNotification({
  title: 'เบิกของสำเร็จ',
  message: 'คุณเบิกอุปกรณ์แล้ว 10 ชิ้น',
  type: 'success',
  recipient: userId,
  recipientName: 'ชื่อผู้ใช้',
  priority: 'medium',
  actionUrl: '/dashboard/withdraw-items',
  relatedTo: 'withdrawItem',
  relatedId: itemId,
});
```

### 4. สร้าง Bulk Notifications

```typescript
import { createBulkNotifications } from '@/lib/notification-helper';

await createBulkNotifications(
  [userId1, userId2, userId3],
  {
    title: 'ประกาศ',
    message: 'มีการอัปเดตระบบใหม่',
    type: 'info',
    priority: 'high',
  }
);
```

## 🎯 Notification Types

### Browser Notification Options

```typescript
interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;              // Custom icon URL
  badge?: string;             // Badge icon URL
  image?: string;             // Large image URL
  tag?: string;               // Unique tag for grouping
  requireInteraction?: boolean; // ไม่ปิดอัตโนมัติ
  silent?: boolean;           // ไม่มีเสียง
  vibrate?: number[];         // Pattern การสั่น
  data?: any;                 // Custom data
  actions?: NotificationAction[]; // Action buttons
}
```

### Toast Notification Types

- **success** - สีเขียว (✅)
- **warning** - สีเหลือง (⚠️)
- **error** - สีแดง (❌)
- **info** - สีน้ำเงิน (ℹ️)

## 📊 Notification Model

```typescript
{
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  recipient: ObjectId;
  recipientName?: string;
  relatedTo?: string;
  relatedId?: ObjectId;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔧 Configuration

### Polling Interval

```tsx
useNotifications({
  interval: 30000, // 30 seconds (default)
});
```

### Permission Request

ระบบจะขอสิทธิ์อัตโนมัติเมื่อ:
- Component mount
- User เปิด Notification Center
- User คลิก "เปิดการแจ้งเตือน"

### Auto-close Duration

- **Normal notifications**: 5 วินาที
- **High priority**: ตาม requireInteraction (ไม่ปิดอัตโนมัติ)
- **Toast**: 4-6 วินาที (ตาม type)

## 🎨 UI Components

### NotificationCenter

แสดงที่มุมขวาบน (fixed position)

```tsx
<NotificationCenter userId={user._id} token={token} />
```

Features:
- ✅ Bell icon พร้อม unread badge
- ✅ Dropdown list
- ✅ Unread/Read separation
- ✅ Mark as read buttons
- ✅ Permission request UI

## 🔐 Security

- ✅ **Authentication Required** - ต้องมี token
- ✅ **User Isolation** - ผู้ใช้เห็นเฉพาะ notification ของตัวเอง
- ✅ **Permission Check** - ตรวจสอบสิทธิ์ก่อนแสดง browser notification

## 📈 Performance

- ✅ **Efficient Polling** - ตรวจสอบเฉพาะ unread
- ✅ **Lazy Loading** - โหลดเมื่อต้องใช้
- ✅ **State Caching** - Cache notifications ใน state
- ✅ **Indexed Queries** - MongoDB indexes สำหรับ performance

## 🔄 Integration

### Google Sheets Backup

การแจ้งเตือนจะถูก backup ไปยัง Google Sheets อัตโนมัติ

### Discord Webhook

ส่งการแจ้งเตือนไปยัง Discord channel (ถ้า configured)

## 💡 Best Practices

1. **ใช้ Priority อย่างเหมาะสม**
   - `high` - สำคัญมาก (requireInteraction)
   - `medium` - ปกติ (default)
   - `low` - ไม่จำเป็น

2. **กำหนด Action URL**
   - ใช้ `actionUrl` เพื่อเปิดหน้าที่เกี่ยวข้อง
   - ช่วยให้ user ไปยังหน้าที่ต้องการได้ทันที

3. **ใช้ Related Fields**
   - `relatedTo` - ประเภทของ entity
   - `relatedId` - ID ของ entity
   - ช่วยในการ track และ filter

4. **Expiration Dates**
   - ใช้ `expiresAt` สำหรับการแจ้งเตือนชั่วคราว
   - ระบบจะกรองอัตโนมัติ

## 🐛 Troubleshooting

### Browser Notification ไม่ทำงาน

1. ตรวจสอบว่า browser รองรับ
2. ตรวจสอบ permission (`Notification.permission`)
3. ต้องเป็น HTTPS (production) หรือ localhost (development)

### Toast ไม่แสดง

1. ตรวจสอบว่า `react-hot-toast` ถูก import ใน `app/layout.tsx`
2. ตรวจสอบ console สำหรับ errors

### Notifications ไม่อัปเดต

1. ตรวจสอบ polling interval
2. ตรวจสอบ API response
3. ตรวจสอบ network tab

## 📝 Examples

ดูตัวอย่างการใช้งานใน:
- `components/Layout.tsx` - การเพิ่ม NotificationCenter
- `hooks/useNotifications.ts` - การใช้ hook
- `app/api/notifications/route.ts` - API endpoints

ระบบแจ้งเตือนพร้อมใช้งาน!
