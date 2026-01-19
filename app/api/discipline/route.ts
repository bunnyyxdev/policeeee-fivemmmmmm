import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Discipline from '@/models/Discipline';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { saveDisciplineToSheet } from '@/lib/google-sheets-helpers';
import { sendDiscordNotification } from '@/lib/discord-webhook';
import { logActivity } from '@/lib/activity-log';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);
    const { searchParams } = new URL(request.url);

    const query: any = {};

    // Search functionality
    if (search) {
      query.$or = [
        { officerName: { $regex: search, $options: 'i' } },
        { violation: { $regex: search, $options: 'i' } },
        { issuedByName: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    const status = searchParams.get('status');
    if (status) {
      query.status = status;
    }

    // Filter by date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Include the entire end date by setting to end of day
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    // All users can see all discipline records

    const [records, total] = await Promise.all([
      (Discipline as any).find(query)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Discipline as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: records,
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

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate required fields
    if (!body.officerName || !body.violation) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อตำรวจ, ความผิด)' },
        { status: 400 }
      );
    }

    const record = await (Discipline as any).create({
      officerName: body.officerName,
      officerId: body.officerId || undefined,
      violation: body.violation,
      violationDate: body.violationDate ? new Date(body.violationDate) : new Date(),
      issuedBy: user.userId,
      issuedByName: userDoc.name,
      status: body.status || 'pending',
      appealReason: body.appealReason || undefined,
      notes: body.notes || undefined,
      attachments: body.attachments || undefined,
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Discipline',
        entityId: record._id.toString(),
        entityName: `โทษวินัย: ${record.officerName}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          officerName: record.officerName,
          violation: record.violation,
          violationDate: record.violationDate,
          status: record.status,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    // Backup to Google Sheets with template
    try {
      await saveDisciplineToSheet({
        ...record.toObject(),
        issuedByName: userDoc.name,
      });
    } catch (error) {
      console.error('Failed to backup to Google Sheets:', error);
    }

    // Send Discord notification with complete information
    try {
      let discordMessage = `**ชื่อตำรวจ:** ${record.officerName}\n`;
      discordMessage += `**ความผิด:** ${record.violation}\n`;
      discordMessage += `**วันที่กระทำผิด:** ${record.violationDate ? new Date(record.violationDate).toLocaleDateString('th-TH') : '-'}\n`;
      discordMessage += `**สถานะ:** ${getStatusLabel(record.status)}\n`;
      discordMessage += `**ออกโดย:** ${userDoc.name}\n`;
      
      if (record.notes) {
        discordMessage += `**หมายเหตุ:** ${record.notes}\n`;
      }

      await sendDiscordNotification(
        '⚖️ โทษวินัยตำรวจใหม่',
        discordMessage,
        0xf39c12, // Orange color for warning
        'admin'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    issued: 'ออกแล้ว',
    appealed: 'อุทธรณ์',
    resolved: 'แก้ไขแล้ว',
  };
  return labels[status] || status;
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
