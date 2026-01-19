# แปลง credentials.json เป็น .env

## วิธีที่ 1: ใช้สคริปต์ (แนะนำ)

1. วางไฟล์ `credentials.json` ใน root directory
2. รันคำสั่ง:
   ```bash
   node scripts/convert-credentials-to-env.js
   ```
3. คัดลอกผลลัพธ์ไปใส่ในไฟล์ `.env`

## วิธีที่ 2: แปลงด้วยตนเอง

### ขั้นตอน:

1. เปิดไฟล์ `credentials.json`
2. คัดลอกค่าจากฟิลด์ต่อไปนี้:

### จาก credentials.json:

```json
{
  "client_email": "your-service-account@project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

### เพิ่มในไฟล์ .env:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id-here
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n
```

### หมายเหตุสำคัญ:

1. **GOOGLE_SHEETS_CLIENT_EMAIL**: คัดลอกจาก `client_email` ใน credentials.json
2. **GOOGLE_SHEETS_PRIVATE_KEY**: 
   - คัดลอกจาก `private_key` ใน credentials.json
   - **สำคัญ**: ต้องเก็บ `\n` (newlines) ไว้ใน .env
   - ตัวอย่าง: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n`
3. **GOOGLE_SHEETS_SPREADSHEET_ID**: Spreadsheet ID จาก Google Sheets URL

### ตัวอย่างการแปลง:

**credentials.json:**
```json
{
  "type": "service_account",
  "project_id": "my-project",
  "private_key_id": "abc123",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "police-sheets@my-project.iam.gserviceaccount.com",
  ...
}
```

**ใน .env:**
```env
GOOGLE_SHEETS_CLIENT_EMAIL=police-sheets@my-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

## วิธีที่ 3: ใช้ JSON String (ทางเลือก)

ถ้าต้องการใส่ credentials ทั้งหมดเป็น JSON string:

```env
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**หมายเหตุ**: ต้อง escape quotes และ newlines ใน JSON string

## ตรวจสอบการตั้งค่า

หลังจากตั้งค่าแล้ว:

1. Restart development server (`npm run dev`)
2. ตรวจสอบว่าไม่มี error เกี่ยวกับ Google Sheets credentials
3. ทดสอบการใช้งาน Google Sheets integration

## สำหรับ Vercel Deployment

1. ไปที่ Vercel Dashboard → Project → Settings → Environment Variables
2. เพิ่ม:
   - `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `GOOGLE_SHEETS_PRIVATE_KEY` (ใส่ทั้ง private key รวม `\n`)
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
3. Redeploy application
