import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

let doc: GoogleSpreadsheet | null = null;

function loadCredentials() {
  // Try to load from environment variables first
  if (GOOGLE_SHEETS_CLIENT_EMAIL && GOOGLE_SHEETS_PRIVATE_KEY) {
    return {
      client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: GOOGLE_SHEETS_PRIVATE_KEY,
    };
  }

  // Fallback: Try to load from GOOGLE_SHEETS_CREDENTIALS JSON string
  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (credentialsJson) {
    try {
      return JSON.parse(credentialsJson);
    } catch (error) {
      console.error('Failed to parse GOOGLE_SHEETS_CREDENTIALS:', error);
      throw new Error('Invalid GOOGLE_SHEETS_CREDENTIALS format. Please check your environment variable.');
    }
  }

  throw new Error(
    'Google Sheets credentials not found. Please set GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY ' +
    'environment variables, or GOOGLE_SHEETS_CREDENTIALS as JSON string.'
  );
}

async function getGoogleSheet() {
  if (doc) return doc;

  const creds = loadCredentials();
  
  if (!creds.client_email || !creds.private_key) {
    throw new Error('Invalid credentials format. Missing client_email or private_key in environment variables.');
  }

  if (!GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not set');
  }

  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  doc = new GoogleSpreadsheet(GOOGLE_SHEETS_SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();

  return doc;
}

export async function appendToSheet(sheetName: string, data: Record<string, any>) {
  try {
    const doc = await getGoogleSheet();
    let sheet = doc.sheetsByTitle[sheetName];

    if (!sheet) {
      sheet = await doc.addSheet({ title: sheetName });
    }

    await sheet.addRow(data);
    return true;
  } catch (error) {
    console.error('Failed to append to Google Sheet:', error);
    throw error;
  }
}

export async function initializeSheetTemplate(
  sheetName: string,
  headers: string[]
): Promise<boolean> {
  try {
    const doc = await getGoogleSheet();
    let sheet = doc.sheetsByTitle[sheetName];

    if (!sheet) {
      // Create new sheet
      sheet = await doc.addSheet({ title: sheetName });
      
      // Set header row
      await sheet.setHeaderRow(headers);
      
      // Format header row (make it bold and freeze)
      await sheet.loadCells('A1:' + getColumnLetter(headers.length) + '1');
      for (let i = 0; i < headers.length; i++) {
        const cell = sheet.getCell(0, i);
        cell.value = headers[i];
        cell.textFormat = { bold: true };
        cell.backgroundColor = { red: 0.2, green: 0.2, blue: 0.2 };
      }
      await sheet.saveUpdatedCells();

      // Freeze header row
      // Get existing grid properties and update only frozenRowCount
      // For new sheets, gridProperties may not be loaded, so we provide defaults
      const existingGridProperties = (sheet.gridProperties || {}) as any;
      sheet.gridProperties = {
        ...existingGridProperties,
        rowCount: existingGridProperties.rowCount || 1000,
        columnCount: existingGridProperties.columnCount || headers.length,
        frozenRowCount: 1,
      };
      await sheet.saveUpdatedCells();

      return true;
    } else {
      // Check if headers exist
      await sheet.loadHeaderRow();
      const existingHeaders = sheet.headerValues || [];

      // If headers don't match, update them
      if (existingHeaders.length !== headers.length || 
          !headers.every((h, i) => existingHeaders[i] === h)) {
        await sheet.setHeaderRow(headers);
        return true;
      }

      return false; // Already initialized
    }
  } catch (error) {
    console.error('Failed to initialize sheet template:', error);
    throw error;
  }
}

export async function appendWithTemplate(
  templateKey: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const { SHEET_TEMPLATES } = await import('./google-sheets-templates');
    const template = SHEET_TEMPLATES[templateKey as keyof typeof SHEET_TEMPLATES];

    if (!template) {
      throw new Error(`Template "${templateKey}" not found`);
    }

    // Initialize sheet with template if needed
    await initializeSheetTemplate(template.sheetName, template.headers);

    // Map data to headers
    const mappedData: Record<string, any> = {};
    
    // Add default timestamp fields
    const now = new Date();
    mappedData['วันที่'] = now.toLocaleDateString('th-TH');
    mappedData['เวลา'] = now.toLocaleTimeString('th-TH');

    // Map data fields
    template.headers.forEach((header) => {
      if (header !== 'วันที่' && header !== 'เวลา') {
        // Try to find matching field in data
        const dataKey = Object.keys(data).find(
          (key) => key.toLowerCase() === header.toLowerCase() ||
                   key === header ||
                   getFieldMapping(templateKey)[key] === header
        );
        mappedData[header] = dataKey ? data[dataKey] : data[header] || '';
      }
    });

    // Append to sheet
    await appendToSheet(template.sheetName, mappedData);
    return true;
  } catch (error) {
    console.error(`Failed to append with template "${templateKey}":`, error);
    throw error;
  }
}

function getColumnLetter(columnNumber: number): string {
  let result = '';
  while (columnNumber > 0) {
    columnNumber--;
    result = String.fromCharCode(65 + (columnNumber % 26)) + result;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return result;
}

function getFieldMapping(templateKey: string): Record<string, string> {
  // Field mapping from model fields to sheet headers
  const mappings: Record<string, Record<string, string>> = {
    WithdrawItems: {
      itemName: 'ชื่อของ',
      quantity: 'จำนวน',
      unit: 'หน่วย',
      withdrawnByName: 'ชื่อผู้เบิก',
      notes: 'หมายเหตุ',
      status: 'สถานะ',
      approvedByName: 'ผู้อนุมัติ',
      approvedAt: 'วันที่อนุมัติ',
      _id: 'ID',
    },
    TimeTracking: {
      caregiverName: 'ชื่อพี่เลี้ยง',
      caredForPerson: 'ชื่อนักเรียนตำรวจ',
      startTime: 'เวลาเริ่มต้น',
      endTime: 'เวลาสิ้นสุด',
      duration: 'ระยะเวลา (นาที)',
      recordedByName: 'ชื่อผู้บันทึก',
      notes: 'หมายเหตุ',
      status: 'สถานะ',
      _id: 'ID',
    },
    Cash: {
      gameName: 'ชื่อเกม',
      description: 'รายละเอียด',
      imageUrl: 'รูปภาพ Error',
      category: 'หมวดหมู่',
      reportedByName: 'ชื่อผู้รายงาน',
      date: 'วันที่รายงาน',
      status: 'สถานะ',
      confirmedByName: 'ยืนยันโดย',
      confirmedAt: 'วันที่ยืนยัน',
      notes: 'หมายเหตุ',
      _id: 'ID',
    },
    // Add more mappings as needed
  };

  return mappings[templateKey] || {};
}

export async function readFromSheet(sheetName: string) {
  try {
    const doc = await getGoogleSheet();
    const sheet = doc.sheetsByTitle[sheetName];

    if (!sheet) {
      return [];
    }

    const rows = await sheet.getRows();
    return rows.map((row) => row.toObject());
  } catch (error) {
    console.error('Failed to read from Google Sheet:', error);
    throw error;
  }
}
