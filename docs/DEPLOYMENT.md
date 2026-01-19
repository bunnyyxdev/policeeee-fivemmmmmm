# การ Deploy ระบบตำรวจ Preview City

คู่มือการ deploy ระบบตำรวจ Preview City ไปยัง production

## Prerequisites

- Node.js 18+ และ npm
- MongoDB database (local หรือ cloud)
- Google Cloud Project สำหรับ Google Sheets (ถ้าใช้งาน)
- Discord Webhook URL (ถ้าใช้งาน)

## ขั้นตอนการ Deploy

### 1. เตรียม Environment Variables

สร้างไฟล์ `.env` ใน root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://your-mongodb-uri

# JWT Secret (ควรเป็นค่าสุ่มและปลอดภัย)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Discord Webhooks (optional - can use multiple webhooks per type, separated by commas)
# General webhook (fallback for all types if type-specific is not set)
POLICE_WEBHOOK_URL=https://discord.com/api/webhooks/your-general-webhook-url
POLICE_WEBHOOK_GENERAL=https://discord.com/api/webhooks/your-general-webhook-url

# Type-specific webhooks
POLICE_WEBHOOK_NOTIFICATIONS=https://discord.com/api/webhooks/your-notifications-webhook-url
POLICE_WEBHOOK_WITHDRAWALS=https://discord.com/api/webhooks/your-withdrawals-webhook-url
POLICE_WEBHOOK_ADMIN=https://discord.com/api/webhooks/your-admin-webhook-url
POLICE_WEBHOOK_ACTIVITIES=https://discord.com/api/webhooks/your-activities-webhook-url

# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Admin Credentials
ADMIN_USERNAME=administrator
ADMIN_PASSWORD=your-secure-password

# Next.js Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

### 2. เตรียม Google Sheets Credentials

1. วางไฟล์ `credentials.json` ใน root directory
2. ดูรายละเอียดเพิ่มเติมที่ [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)

### 3. Build Project

```bash
npm install
npm run build
```

### 4. Start Production Server

```bash
npm start
```

## Deploy บน Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel
```

### 3. ตั้งค่า Environment Variables

1. ไปที่ Vercel Dashboard
2. เลือก Project
3. ไปที่ **Settings** > **Environment Variables**
4. เพิ่ม environment variables ตาม `.env.example`

### 4. Upload credentials.json

สำหรับ Google Sheets integration:

1. ใช้ Vercel CLI:
   ```bash
   vercel env add GOOGLE_SHEETS_CREDENTIALS
   ```
   แล้ววาง JSON content จาก `credentials.json`

หรือ

2. ใช้ Vercel Storage หรือ Google Cloud Storage แทน

## Deploy บน Docker

### 1. สร้าง Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Build Docker Image

```bash
docker build -t police-preview-city .
```

### 3. Run Container

```bash
docker run -p 3000:3000 \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-jwt-secret \
  -v $(pwd)/credentials.json:/app/credentials.json \
  police-preview-city
```

## Security Checklist

- [ ] เปลี่ยน `JWT_SECRET` เป็นค่าสุ่มที่ปลอดภัย
- [ ] เปลี่ยน `ADMIN_PASSWORD` จากค่า default
- [ ] ตรวจสอบว่า `.env` ไม่ถูก commit เข้า Git
- [ ] ตรวจสอบว่า `credentials.json` ไม่ถูก commit เข้า Git
- [ ] ตั้งค่า MongoDB connection string ที่ปลอดภัย
- [ ] เปิดใช้งาน HTTPS ใน production
- [ ] ตั้งค่า CORS ให้เหมาะสม
- [ ] ตรวจสอบ rate limiting

## Monitoring

### Recommended Tools

- **Logging**: ใช้ console.log หรือ logging service
- **Error Tracking**: Sentry, LogRocket
- **Performance**: Vercel Analytics, Google Analytics

## Backup

- MongoDB: ตั้งค่า automatic backup
- Google Sheets: ใช้เป็น backup และ sync ข้อมูล
- Database: Export ข้อมูลเป็น JSON/CSV เป็นประจำ

## Troubleshooting

### Build Error

- ตรวจสอบว่า dependencies ติดตั้งครบ
- ลบ `node_modules` และ `.next` แล้วรัน `npm install` ใหม่

### Runtime Error

- ตรวจสอบ environment variables
- ตรวจสอบ MongoDB connection
- ตรวจสอบ Google Sheets credentials

### Performance Issues

- ใช้ Next.js Image optimization
- ตั้งค่า caching
- ใช้ CDN สำหรับ static files
