# PWA (Progressive Web App) Setup Guide

## 📱 ภาพรวม

ระบบ Preview City Police รองรับ PWA (Progressive Web App) เพื่อให้สามารถ:
- ติดตั้งแอปบนมือถือ/แท็บเล็ต
- ใช้งานแบบออฟไลน์
- รับการแจ้งเตือนแบบ Push Notifications
- ประสบการณ์เหมือนแอป native

## 🎯 Features ที่มี

### 1. PWA Installation
- ✅ Manifest.json สำหรับ PWA configuration
- ✅ Install prompt แสดงอัตโนมัติเมื่อพร้อม
- ✅ รองรับทั้ง Android และ iOS

### 2. Offline Mode
- ✅ Service Worker สำหรับ cache หน้าเว็บ
- ✅ ใช้งานได้แม้ไม่มีอินเทอร์เน็ต (บางหน้า)
- ✅ Offline page เมื่อไม่สามารถเชื่อมต่อได้

### 3. Mobile Notifications
- ✅ Push Notifications support
- ✅ Browser notifications
- ✅ Background sync สำหรับ offline actions

### 4. Mobile-Responsive
- ✅ ปรับปรุง UI สำหรับมือถือ
- ✅ Touch-friendly buttons
- ✅ Safe area support สำหรับ notched devices
- ✅ Dynamic viewport height (100dvh)

## 📋 ไฟล์ที่สร้าง

### 1. `public/manifest.json`
- PWA configuration
- App icons และ metadata
- Shortcuts สำหรับ quick access

### 2. `public/sw.js`
- Service Worker สำหรับ offline support
- Cache management
- Push notification handlers
- Background sync

### 3. `public/offline.html`
- หน้าแสดงเมื่อออฟไลน์
- ปุ่มลองใหม่

### 4. `components/PWAInstallPrompt.tsx`
- Component แสดง install prompt
- Auto-detect เมื่อพร้อมติดตั้ง

### 5. `hooks/useMobileNotifications.ts`
- Hook สำหรับจัดการ notifications
- Request permission
- Show notifications

### 6. `app/sw-register.ts`
- Service Worker registration
- Push subscription helpers

## 🔧 การตั้งค่า

### 1. สร้าง Icons

ต้องสร้างไฟล์ icons ต่อไปนี้ใน `public/`:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

**คำแนะนำ:**
- ใช้ PNG format
- Icons ควรเป็น square (1:1 ratio)
- ใช้สีที่สอดคล้องกับ brand
- สำหรับ iOS: ใช้ icon ที่มี padding (ไม่เต็มขอบ)

### 2. VAPID Keys (สำหรับ Push Notifications)

ถ้าต้องการ Push Notifications:

```bash
# สร้าง VAPID keys
npm install -g web-push
web-push generate-vapid-keys
```

เพิ่มใน `.env`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### 3. Testing

1. **Local Testing:**
   ```bash
   npm run build
   npm start
   ```

2. **HTTPS Required:**
   - PWA ต้องใช้ HTTPS (หรือ localhost)
   - Service Worker ทำงานได้เฉพาะบน HTTPS

3. **ตรวจสอบ:**
   - เปิด DevTools > Application > Service Workers
   - ตรวจสอบ Manifest
   - ทดสอบ Offline mode

## 📱 การใช้งาน

### สำหรับผู้ใช้

1. **ติดตั้งแอป:**
   - บน Android: จะมีปุ่ม "ติดตั้ง" แสดงอัตโนมัติ
   - บน iOS: ใช้เมนู Share > Add to Home Screen

2. **ใช้งานออฟไลน์:**
   - หน้าเว็บที่เคยเข้าชมจะถูก cache
   - สามารถใช้งานได้แม้ไม่มีอินเทอร์เน็ต

3. **รับการแจ้งเตือน:**
   - อนุญาตการแจ้งเตือนเมื่อถูกถาม
   - จะได้รับ notifications แม้ไม่ได้เปิดแอป

### สำหรับ Developer

1. **อัปเดต Service Worker:**
   - แก้ไข `public/sw.js`
   - เปลี่ยน `CACHE_NAME` version
   - Service Worker จะอัปเดตอัตโนมัติ

2. **เพิ่ม Offline Support:**
   - เพิ่ม routes ใน `STATIC_ASSETS` array
   - Cache API responses ถ้าจำเป็น

3. **Push Notifications:**
   - ใช้ `useMobileNotifications` hook
   - ส่ง notifications ผ่าน API

## 🐛 Troubleshooting

### Service Worker ไม่ทำงาน
- ตรวจสอบว่าใช้ HTTPS (หรือ localhost)
- ตรวจสอบ Console สำหรับ errors
- ลบ cache และ reload

### Install Prompt ไม่แสดง
- ตรวจสอบว่า manifest.json ถูกต้อง
- ตรวจสอบว่า Service Worker ทำงาน
- บน iOS อาจต้องใช้วิธี Add to Home Screen แทน

### Notifications ไม่ทำงาน
- ตรวจสอบว่าได้รับ permission
- ตรวจสอบ VAPID keys (ถ้าใช้ Push)
- ตรวจสอบ browser support

## 📚 Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## ✅ Checklist

- [x] Manifest.json created
- [x] Service Worker implemented
- [x] Offline page created
- [x] Install prompt component
- [x] Mobile notifications hook
- [x] Mobile-responsive improvements
- [ ] Icons created (192x192, 512x512)
- [ ] VAPID keys configured (optional)
- [ ] Testing on real devices
- [ ] Production deployment
