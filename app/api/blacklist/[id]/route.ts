import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blacklist from '@/models/Blacklist';
import User from '@/models/User';
import { requireAuth, handleApiError, authenticateRequest } from '@/lib/api-helpers';
import { verifyTokenServer } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handlerDELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: any
) {
  try {
    await connectDB();

    const blacklistItem = await (Blacklist as any).findById(params.id);
    if (!blacklistItem) {
      return NextResponse.json({ error: 'Blacklist item not found' }, { status: 404 });
    }

    // Only admin or the person who added can delete
    if (user.role !== 'admin' && blacklistItem.addedBy.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userDoc = await (User as any).findById(user.userId);

    await (Blacklist as any).findByIdAndDelete(params.id);

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await logActivity({
        action: 'delete',
        entityType: 'Blacklist',
        entityId: params.id,
        entityName: `Blacklist: ${blacklistItem.name}`,
        performedBy: user.userId,
        performedByName: userDoc?.name || user.userId,
        metadata: {
          deletedName: blacklistItem.name,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      // Failed to log activity - continue anyway
    }

    return NextResponse.json({
      message: 'ลบรายการ Blacklist สำเร็จ',
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function handlerPUT(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: any
) {
  try {
    await connectDB();

    const body = await request.json();
    const { paymentStatus } = body;

    if (!paymentStatus || !['unpaid', 'paid'].includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    const blacklistItem = await (Blacklist as any).findById(params.id);
    if (!blacklistItem) {
      return NextResponse.json({ error: 'Blacklist item not found' }, { status: 404 });
    }

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update payment status
    const updateData: any = {
      paymentStatus: paymentStatus,
    };

    if (paymentStatus === 'paid') {
      updateData.paidAt = new Date();
      updateData.paidBy = user.userId;
      updateData.paidByName = userDoc.name;
    } else {
      updateData.paidAt = undefined;
      updateData.paidBy = undefined;
      updateData.paidByName = undefined;
    }

    const updatedItem = await (Blacklist as any).findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await logActivity({
        action: 'update',
        entityType: 'Blacklist',
        entityId: params.id,
        entityName: `Blacklist: ${blacklistItem.name}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        changes: [{
          field: 'paymentStatus',
          oldValue: blacklistItem.paymentStatus || 'unpaid',
          newValue: paymentStatus,
        }],
        metadata: {
          name: blacklistItem.name,
          paymentStatus: paymentStatus,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      // Failed to log activity - continue anyway
    }

    return NextResponse.json({
      message: paymentStatus === 'paid' ? 'อัปเดตสถานะเป็นชำระค่าปรับแล้ว' : 'อัปเดตสถานะเป็นยังไม่ชำระค่าปรับ',
      data: {
        _id: updatedItem._id.toString(),
        name: updatedItem.name,
        reason: updatedItem.reason,
        fineAmount: updatedItem.fineAmount,
        paymentStatus: updatedItem.paymentStatus,
        paidAt: updatedItem.paidAt,
        paidBy: updatedItem.paidBy?.toString(),
        paidByName: updatedItem.paidByName,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
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
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return handlerPUT(request, { params }, user);
}
