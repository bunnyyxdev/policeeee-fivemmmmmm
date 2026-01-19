import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BackupSchedule from '@/models/BackupSchedule';
import { handleApiError, authenticateRequest } from '@/lib/api-helpers';

// Helper function to calculate next run time (same as in schedule route)
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
      const dayOfWeek = schedule.dayOfWeek ?? 0;
      const currentDayOfWeek = nextRun.getDay();
      let daysUntilNext = (dayOfWeek - currentDayOfWeek + 7) % 7;
      
      if (daysUntilNext === 0 && nextRun <= now) {
        daysUntilNext = 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilNext);
      break;

    case 'monthly':
      const dayOfMonth = schedule.dayOfMonth ?? 1;
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

async function handlerPUT(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: any
) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, description, frequency, time, dayOfWeek, dayOfMonth, isActive, retentionDays, collections } = body;

    const schedule = await (BackupSchedule as any).findById(params.id);
    if (!schedule) {
      return NextResponse.json({ error: 'Backup schedule not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (time !== undefined) updateData.time = time;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (dayOfMonth !== undefined) updateData.dayOfMonth = dayOfMonth;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (retentionDays !== undefined) updateData.retentionDays = retentionDays;
    if (collections !== undefined) updateData.collections = collections;

    // Calculate next run if schedule is active and time/frequency changed
    if (updateData.isActive !== false && (updateData.time || updateData.frequency || updateData.dayOfWeek || updateData.dayOfMonth)) {
      const scheduleForCalculation = { ...schedule.toObject(), ...updateData };
      updateData.nextRun = calculateNextRun(scheduleForCalculation);
    }

    const updatedSchedule = await (BackupSchedule as any).findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: 'อัปเดต backup schedule สำเร็จ',
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function handlerDELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: any
) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();

    const schedule = await (BackupSchedule as any).findByIdAndDelete(params.id);
    if (!schedule) {
      return NextResponse.json({ error: 'Backup schedule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'ลบ backup schedule สำเร็จ',
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function handlerPUTWithParams(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return handlerPUT(request, { params }, user);
}

async function handlerDELETEWithParams(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return handlerDELETE(request, { params }, user);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handlerPUTWithParams(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handlerDELETEWithParams(request, { params });
}
