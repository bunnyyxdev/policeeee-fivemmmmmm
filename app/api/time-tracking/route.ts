import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TimeTracking from '@/models/TimeTracking';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { saveTimeTrackingToSheet } from '@/lib/google-sheets-helpers';
import { logActivity } from '@/lib/activity-log';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { caregiverName: { $regex: search, $options: 'i' } },
        { caredForPerson: { $regex: search, $options: 'i' } },
        { recordedByName: { $regex: search, $options: 'i' } },
      ];
    }

    // All users can see all time tracking records

    const [records, total] = await Promise.all([
      (TimeTracking as any).find(query)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (TimeTracking as any).countDocuments(query),
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
    if (!body.caregiverName || !body.caredForPerson || !body.date || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อพี่เลี้ยง, ชื่อนักเรียนตำรวจ, วันที่, เวลาเริ่มต้น, เวลาสิ้นสุด)' },
        { status: 400 }
      );
    }

    // Calculate duration
    const start = new Date(`${body.date}T${body.startTime}`);
    const end = new Date(`${body.date}T${body.endTime}`);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // in minutes

    if (duration < 0) {
      return NextResponse.json(
        { error: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น' },
        { status: 400 }
      );
    }

    const record = await (TimeTracking as any).create({
      caregiverName: body.caregiverName,
      caredForPerson: body.caredForPerson,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      duration: duration,
      notes: body.notes || undefined,
      recordedBy: user.userId,
      recordedByName: userDoc.name,
      status: 'completed',
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'TimeTracking',
        entityId: record._id.toString(),
        entityName: `ลงเวลา: ${record.caregiverName} - ${record.caredForPerson}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          caregiverName: record.caregiverName,
          caredForPerson: record.caredForPerson,
          date: record.date,
          duration: record.duration,
          startTime: record.startTime,
          endTime: record.endTime,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    // Backup to Google Sheets with template
    try {
      await saveTimeTrackingToSheet({
        ...record.toObject(),
        recordedByName: userDoc.name,
      });
    } catch (error) {
      console.error('Failed to backup to Google Sheets:', error);
    }

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
