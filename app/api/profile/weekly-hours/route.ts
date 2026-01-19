import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/api-helpers';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

async function getGoogleSheetDocument() {
  const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  
  // Try to load from environment variables first
  let creds: { client_email: string; private_key: string };
  
  if (GOOGLE_SHEETS_CLIENT_EMAIL && GOOGLE_SHEETS_PRIVATE_KEY) {
    creds = {
      client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: GOOGLE_SHEETS_PRIVATE_KEY,
    };
  } else {
    const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (credentialsJson) {
      try {
        creds = JSON.parse(credentialsJson);
      } catch (error) {
        throw new Error('Invalid GOOGLE_SHEETS_CREDENTIALS format');
      }
    } else {
      throw new Error('Google Sheets credentials not found');
    }
  }
  
  if (!GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID not set');
  }
  
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

async function handlerGET(request: NextRequest, authUser: any) {
  try {
    // ดึงข้อมูล user จาก database โดยใช้ userId
    await connectDB();
    const dbUser = await (User as any).findById(authUser.userId).select('name username').lean();
    
    if (!dbUser) {
      console.error('[Weekly Hours API] User not found in database:', authUser.userId);
      return NextResponse.json({
        weeklyHours: null,
        error: 'User not found',
      });
    }
    
    const sheetName = 'สรุปการทำงาน';
    // ใช้ชื่อจาก database (name เป็นหลัก ถ้าไม่มีใช้ username)
    const officerName = dbUser.name || dbUser.username || '';
    
    console.log('[Weekly Hours API] Fetching hours for user:', {
      userId: authUser.userId,
      name: dbUser.name,
      username: dbUser.username,
      usingName: officerName,
    });
    
    const doc = await getGoogleSheetDocument();
    const sheet = doc.sheetsByTitle[sheetName];
    
    if (!sheet) {
      console.error('[Weekly Hours API] Sheet not found:', sheetName);
      return NextResponse.json({ 
        weeklyHours: null,
        error: 'Sheet not found' 
      });
    }
    
    // Load all rows
    const rows = await sheet.getRows();
    console.log('[Weekly Hours API] Total rows found:', rows.length);
    
    // Read from worksheet "สรุปการทำงาน":
    // Column C (index 2) = Name (ชื่อ)
    // Column D (index 3) = Hours (ชั่วโมง)
    let weeklyHours: string | null = null;
    
    // Helper function to normalize names for comparison
    const normalizeName = (name: string) => {
      return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
    };
    
    const normalizedofficerName = normalizeName(officerName);
    console.log('[Weekly Hours API] Looking for officer name (normalized):', normalizedofficerName);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Access raw data array (0-based index: A=0, B=1, C=2, D=3)
      const rawData = (row as any)._rawData || [];
      const rowName = rawData[2]?.toString().trim() || null; // Column C - Name
      const rowHours = rawData[3]?.toString().trim() || null; // Column D - Hours
      
      // Skip header rows (rows that contain "ชื่อ", "ชั่วโมง", etc.)
      const isHeaderRow = rowName && (
        rowName === 'ชื่อ' || 
        rowName.toLowerCase().includes('name') ||
        rowName.toLowerCase().includes('ชั่วโมง') ||
        rowName.toLowerCase().includes('hours')
      );
      
      if (isHeaderRow) {
        if (i < 3) {
          console.log(`[Weekly Hours API] Row ${i}: Skipping header row - Name="${rowName}", Hours="${rowHours}"`);
        }
        continue;
      }
      
      // Debug: log first few data rows
      if (i < 5 && rowName) {
        console.log(`[Weekly Hours API] Row ${i}: Name="${rowName}", Hours="${rowHours}"`);
      }
      
      // Match by name (case-insensitive, flexible whitespace) in Column C
      if (rowName) {
        const normalizedRowName = normalizeName(rowName);
        
        if (normalizedRowName === normalizedofficerName) {
          // Return hours from Column D (make sure it's a valid number/value)
          weeklyHours = rowHours && rowHours !== 'ชั่วโมงเข้าเวร' && rowHours !== 'ยอดรวมทั้งหมดในสัปดาห์นี้' 
            ? rowHours 
            : null;
          console.log('[Weekly Hours API] Match found!', {
            row: i,
            name: rowName,
            hours: weeklyHours
          });
          break;
        }
      }
    }
    
    if (!weeklyHours) {
      console.warn('[Weekly Hours API] No match found for officer:', {
        originalName: officerName,
        normalizedName: normalizedofficerName,
        totalRowsChecked: rows.length
      });
    }
    
    return NextResponse.json({
      weeklyHours: weeklyHours,
      officerName: officerName,
    });
  } catch (error: any) {
    console.error('[Weekly Hours API] Error:', error);
    // Don't throw error, just return null so card still works
    return NextResponse.json({
      weeklyHours: null,
      error: error.message || 'Failed to fetch weekly hours',
    });
  }
}

export const GET = requireAuth(handlerGET);
