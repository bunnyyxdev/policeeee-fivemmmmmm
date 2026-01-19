# การตั้งค่า Google Sheets Integration

ระบบตำรวจ Preview City รองรับการบันทึกข้อมูลไปยัง Google Sheets เป็น backup และ fallback จาก MongoDB

## ขั้นตอนการตั้งค่า

### 1. สร้าง Google Cloud Project

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่
3. เปิดใช้งาน **Google Sheets API** และ **Google Drive API**

### 2. สร้าง Service Account

1. ไปที่ **IAM & Admin** > **Service Accounts**
2. คลิก **Create Service Account**
3. กรอกข้อมูล:
   - **Service account name**: `police-preview-city-sheets`
   - **Service account ID**: (จะสร้างอัตโนมัติ)
   - **Description**: `Service account for Police Preview City Google Sheets integration`
4. คลิก **Create and Continue**
5. ข้ามขั้นตอน Grant access (ไม่จำเป็น)
6. คลิก **Done**

### 3. สร้าง Key สำหรับ Service Account

1. คลิกที่ Service Account ที่สร้างไว้
2. ไปที่แท็บ **Keys**
3. คลิก **Add Key** > **Create new key**
4. เลือก **JSON** และคลิก **Create**
5. ไฟล์ JSON จะถูกดาวน์โหลดอัตโนมัติ

### 4. วางไฟล์ credentials.json

1. เปลี่ยนชื่อไฟล์ JSON ที่ดาวน์โหลดมาเป็น `credentials.json`
2. วางไฟล์ `credentials.json` ใน **root directory** ของโปรเจกต์ (เดียวกันกับ `package.json`)
3. **สำคัญ**: ไฟล์นี้จะถูก ignore โดย git (อยู่ใน `.gitignore`) เพื่อความปลอดภัย

### 5. สร้าง Google Spreadsheet

1. ไปที่ [Google Sheets](https://sheets.google.com/)
2. สร้าง Spreadsheet ใหม่
3. คัดลอก **Spreadsheet ID** จาก URL
   - ตัวอย่าง URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
   - `SPREADSHEET_ID_HERE` คือ Spreadsheet ID ที่ต้องการ

### 6. แชร์ Spreadsheet ให้ Service Account

1. เปิด Spreadsheet ที่สร้างไว้
2. คลิก **Share** (ปุ่ม "แชร์" มุมบนขวา)
3. ใส่ **Email ของ Service Account** (จาก `client_email` ใน `credentials.json`)
   - ตัวอย่าง: `police-preview-city-sheets@your-project.iam.gserviceaccount.com`
4. เลือกสิทธิ์เป็น **Editor**
5. คลิก **Send**

### 7. ตั้งค่า Environment Variable

เพิ่ม Spreadsheet ID ในไฟล์ `.env`:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id-here
```

## โครงสร้างไฟล์ credentials.json

ไฟล์ `credentials.json` ควรมีโครงสร้างดังนี้:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
}
```

## การใช้งาน

ระบบจะใช้ Google Sheets เป็น backup และ fallback โดยอัตโนมัติเมื่อ:

1. MongoDB ไม่สามารถบันทึกข้อมูลได้
2. ต้องการ backup ข้อมูลเพิ่มเติม

## Troubleshooting

### Error: credentials.json not found
- ตรวจสอบว่าไฟล์ `credentials.json` อยู่ใน root directory ของโปรเจกต์
- ตรวจสอบชื่อไฟล์ว่าถูกต้อง (ต้องเป็น `credentials.json` เท่านั้น)

### Error: Invalid credentials.json format
- ตรวจสอบว่าไฟล์ JSON มีโครงสร้างที่ถูกต้อง
- ตรวจสอบว่ามี `client_email` และ `private_key` อยู่ในไฟล์

### Error: Permission denied
- ตรวจสอบว่าได้แชร์ Spreadsheet ให้ Service Account แล้ว
- ตรวจสอบว่าสิทธิ์เป็น **Editor** หรือสูงกว่า

### Error: Spreadsheet not found
- ตรวจสอบว่า Spreadsheet ID ใน `.env` ถูกต้อง
- ตรวจสอบว่า Service Account มีสิทธิ์เข้าถึง Spreadsheet

## ความปลอดภัย

⚠️ **สำคัญ**: ไฟล์ `credentials.json` มีข้อมูลสำคัญ อย่า:
- Commit ไฟล์นี้เข้า Git (ถูก ignore แล้ว)
- แชร์ไฟล์นี้กับผู้อื่น
- Upload ไฟล์นี้ไปยัง public repository

ไฟล์ `credentials.json` จะถูก ignore โดย `.gitignore` อัตโนมัติ
