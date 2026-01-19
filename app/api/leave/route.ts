import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { saveLeaveToSheet } from '@/lib/google-sheets-helpers';
import { sendDiscordNotification } from '@/lib/discord-webhook';
import { logActivity } from '@/lib/activity-log';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { requestedByName: { $regex: search, $options: 'i' } },
      ];
    }

    // All users can see all leave records

    const [leaves, total] = await Promise.all([
      (Leave as any).find(query)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Leave as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: leaves,
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
    if (!body.startDate || !body.endDate || !body.reason) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (วันเริ่มต้นลา, วันสิ้นสุดลา, เหตุผลการลา)' },
        { status: 400 }
      );
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    // Validate dates
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'วันสิ้นสุดลาต้องมากกว่าหรือเท่ากับวันเริ่มต้นลา' },
        { status: 400 }
      );
    }

    // Calculate duration
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await (Leave as any).create({
      leaveDate: startDate, // Use startDate as leaveDate
      leaveType: body.leaveType || 'other',
      reason: body.reason,
      startDate: startDate,
      endDate: endDate,
      duration: diffDays,
      requestedBy: user.userId,
      requestedByName: userDoc.name,
      status: 'pending',
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Leave',
        entityId: leave._id.toString(),
        entityName: `การลา: ${userDoc.name} (${diffDays} วัน)`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          duration: leave.duration,
          reason: leave.reason,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    // Backup to Google Sheets with template
    try {
      await saveLeaveToSheet({
        ...leave.toObject(),
        requestedByName: userDoc.name,
      });
    } catch (error) {
      console.error('Failed to backup to Google Sheets:', error);
    }

    // Send Discord notification with complete information
    try {
      let discordMessage = `**ผู้ร้องขอ:** ${userDoc.name}\n`;
      discordMessage += `**วันเริ่มต้นลา:** ${startDate.toLocaleDateString('th-TH')}\n`;
      discordMessage += `**วันสิ้นสุดลา:** ${endDate.toLocaleDateString('th-TH')}\n`;
      discordMessage += `**จำนวนวัน:** ${diffDays} วัน\n`;
      discordMessage += `**ประเภทการลา:** ${getLeaveTypeLabel(leave.leaveType)}\n`;
      discordMessage += `**เหตุผลการลา:** ${leave.reason}\n`;
      discordMessage += `**สถานะ:** ${getStatusLabel(leave.status)}\n`;
      discordMessage += `**วันที่ร้องขอ:** ${new Date(leave.createdAt).toLocaleString('th-TH')}\n`;

      await sendDiscordNotification(
        '📅 แจ้งลาใหม่',
        discordMessage,
        0x3498db, // Blue
        'admin'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return NextResponse.json({ data: leave }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

function getLeaveTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sick: 'ลาป่วย',
    personal: 'ลาส่วนตัว',
    vacation: 'ลาพักผ่อน',
    emergency: 'ลาฉุกเฉิน',
    other: 'อื่นๆ',
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    approved: 'อนุมัติ',
    rejected: 'ปฏิเสธ',
    cancelled: 'ยกเลิก',
  };
  return labels[status] || status;
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
