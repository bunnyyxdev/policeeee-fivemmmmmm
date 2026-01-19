import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CaseRecord from '@/models/CaseRecord';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { logActivity } from '@/lib/activity-log';
import { getClientIP, parseUserAgent } from '@/lib/ip-utils';
import { saveCaseRecordToSheet } from '@/lib/google-sheets-helpers';
import { sendDiscordNotification } from '@/lib/discord-webhook';

// Generate case number: CASE-YYYYMMDD-XXXX
function generateCaseNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `CASE-${year}${month}${day}-${random}`;
}

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const crimeType = searchParams.get('crimeType');

    const query: any = {};

    // Search filter
    if (search) {
      const searchConditions: any[] = [
        { caseNumber: { $regex: search, $options: 'i' } },
        { suspectName: { $regex: search, $options: 'i' } },
        { victimName: { $regex: search, $options: 'i' } },
        { arrestName: { $regex: search, $options: 'i' } },
        { crimeType: { $regex: search, $options: 'i' } },
      ];
      
      // Add optional fields to search if they exist
      searchConditions.push(
        { caseType: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      );
      
      query.$or = searchConditions;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Category filter
    if (category) {
      query.caseCategory = category;
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    // CrimeType filter
    if (crimeType) {
      query.crimeType = crimeType;
    }

    // All authenticated users can view all cases
    // No role-based filtering for viewing

    const [cases, total] = await Promise.all([
      (CaseRecord as any)
        .find(query)
        .sort(sort || { caseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (CaseRecord as any).countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function handlerPOST(request: NextRequest, user: any) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      caseDate,
      incidentDate,
      incidentLocation,
      suspectName,
      suspectId,
      suspectAge,
      suspectAddress,
      suspectPhone,
      victimName,
      victimId,
      victimAge,
      victimAddress,
      victimPhone,
      caseType,
      caseCategory,
      description,
      status,
      priority,
      assignedOfficer,
      assignedOfficerName,
      investigatingOfficers,
      investigatingOfficerNames,
      documents,
      images,
      arrestName,
      arrestIdCard,
      crimeType,
      fineAmount,
      jailTime,
      arrestImages,
      notes,
    } = body;

    // caseType and description are now optional

    // Generate case number
    let caseNumber = generateCaseNumber();
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 10) {
      const existingCase = await (CaseRecord as any).findOne({ caseNumber });
      if (!existingCase) {
        exists = false;
      } else {
        caseNumber = generateCaseNumber();
        attempts++;
      }
    }

    const caseRecord = await (CaseRecord as any).create({
      caseNumber,
      caseDate: caseDate ? new Date(caseDate) : new Date(),
      incidentDate: incidentDate ? new Date(incidentDate) : undefined,
      incidentLocation,
      suspectName,
      suspectId,
      suspectAge,
      suspectAddress,
      suspectPhone,
      victimName,
      victimId,
      victimAge,
      victimAddress,
      victimPhone,
      caseType: caseType || undefined,
      caseCategory: caseCategory || undefined,
      description: description || undefined,
      status: status || 'open',
      priority: priority || 'medium',
      assignedOfficer,
      assignedOfficerName,
      investigatingOfficers: investigatingOfficers || [],
      investigatingOfficerNames: investigatingOfficerNames || [],
      recordedBy: user.userId,
      recordedByName: user.name || 'Unknown',
      documents: documents || [],
      images: images || [],
      arrestName,
      arrestIdCard,
      crimeType,
      fineAmount: fineAmount ? Number(fineAmount) : undefined,
      jailTime,
      arrestImages: arrestImages || [],
      notes,
    });

    // Log activity
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    await logActivity({
      action: 'create',
      entityType: 'CaseRecord',
      entityId: caseRecord._id.toString(),
      entityName: caseNumber,
      performedBy: user.userId,
      performedByName: user.name || 'Unknown',
      ipAddress,
      userAgent,
    });

    // Backup to Google Sheets
    try {
      await saveCaseRecordToSheet({
        caseNumber: caseRecord.caseNumber,
        caseDate: caseRecord.caseDate,
        incidentDate: caseRecord.incidentDate,
        incidentLocation: caseRecord.incidentLocation,
        suspectName: caseRecord.suspectName,
        suspectId: caseRecord.suspectId,
        victimName: caseRecord.victimName,
        victimId: caseRecord.victimId,
        caseType: caseRecord.caseType,
        caseCategory: caseRecord.caseCategory,
        description: caseRecord.description,
        status: caseRecord.status,
        priority: caseRecord.priority,
        assignedOfficerName: caseRecord.assignedOfficerName,
        investigatingOfficerNames: caseRecord.investigatingOfficerNames?.join(', ') || '',
        recordedByName: caseRecord.recordedByName,
        notes: caseRecord.notes,
        _id: caseRecord._id.toString(),
      });
    } catch (error) {
      console.error('Failed to save case record to Google Sheets:', error);
      // Don't fail the request if Google Sheets save fails
    }

      // Send Discord notification
      try {
        await sendDiscordNotification(
          `📋 คดีใหม่: ${caseNumber}`,
          `${caseType ? `**ประเภทคดี:** ${caseType}\n` : ''}` +
          `${caseCategory ? `**หมวดหมู่:** ${caseCategory}\n` : ''}` +
          `**สถานะ:** ${status || 'open'}\n` +
          `**ความสำคัญ:** ${priority || 'medium'}\n` +
          `**บันทึกโดย:** ${user.name || 'Unknown'}\n` +
          `${description ? `**รายละเอียด:** ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}` : ''}`,
          0x3498db,
          'admin'
        );
      } catch (error) {
        console.error('Failed to send Discord notification:', error);
      }

    return NextResponse.json({
      success: true,
      message: 'บันทึกคดีสำเร็จ',
      data: caseRecord,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
