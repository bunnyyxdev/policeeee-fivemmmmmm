import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BackupSchedule from '@/models/BackupSchedule';
import User from '@/models/User';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

// Helper function to calculate next run time
function calculateNextRun(schedule: any): Date {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  const nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case 'weekly':
      const dayOfWeek = schedule.dayOfWeek ?? 0; // Default to Sunday
      const currentDayOfWeek = nextRun.getDay();
      let daysUntilNext = (dayOfWeek - currentDayOfWeek + 7) % 7;
      
      if (daysUntilNext === 0 && nextRun <= now) {
        daysUntilNext = 7; // Next week
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilNext);
      break;

    case 'monthly':
      const dayOfMonth = schedule.dayOfMonth ?? 1; // Default to 1st
      nextRun.setDate(dayOfMonth);
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;

    default:
      nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
}

async function handlerGET(request: NextRequest, user: any) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();

    const schedules = await (BackupSchedule as any).find()
      .sort({ createdAt: -1 })
      .lean()
      .populate('createdBy', 'name username');

    // Calculate next run for each schedule
    const schedulesWithNextRun = schedules.map((schedule: any) => ({
      ...schedule,
      nextRun: schedule.isActive ? calculateNextRun(schedule) : null,
    }));

    return NextResponse.json({
      data: schedulesWithNextRun,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function handlerPOST(request: NextRequest, user: any) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, description, frequency, time, dayOfWeek, dayOfMonth, retentionDays, collections } = body;

    if (!name || !frequency || !time) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อ ความถี่ และเวลา' },
        { status: 400 }
      );
    }

    if (frequency === 'weekly' && (dayOfWeek === undefined || dayOfWeek === null)) {
      return NextResponse.json(
        { error: 'กรุณาเลือกวันในสัปดาห์สำหรับ weekly schedule' },
        { status: 400 }
      );
    }

    if (frequency === 'monthly' && (dayOfMonth === undefined || dayOfMonth === null)) {
      return NextResponse.json(
        { error: 'กรุณาเลือกวันในเดือนสำหรับ monthly schedule' },
        { status: 400 }
      );
    }

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const scheduleData: any = {
      name,
      description,
      frequency,
      time,
      createdBy: user.userId,
      createdByName: userDoc.name,
      isActive: true,
    };

    if (dayOfWeek !== undefined && dayOfWeek !== null) {
      scheduleData.dayOfWeek = dayOfWeek;
    }

    if (dayOfMonth !== undefined && dayOfMonth !== null) {
      scheduleData.dayOfMonth = dayOfMonth;
    }

    if (retentionDays) {
      scheduleData.retentionDays = retentionDays;
    }

    if (collections && Array.isArray(collections)) {
      scheduleData.collections = collections;
    }

    // Calculate next run
    scheduleData.nextRun = calculateNextRun(scheduleData);

    const schedule = await (BackupSchedule as any).create(scheduleData);

    return NextResponse.json({
      success: true,
      data: schedule,
      message: 'สร้าง backup schedule สำเร็จ',
    }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
