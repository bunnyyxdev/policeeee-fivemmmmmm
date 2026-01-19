import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bonus from '@/models/Bonus';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { logActivity } from '@/lib/activity-log';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { reportedByName: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } },
      ];
    }

    // All users can see all bonus records

    const [bonuses, total] = await Promise.all([
      (Bonus as any).find(query)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Bonus as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: bonuses,
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
    if (!body.amount || !body.reason) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (จำนวนเงิน, เหตุผล)' },
        { status: 400 }
      );
    }

    const bonus = await (Bonus as any).create({
      amount: parseFloat(body.amount),
      reason: body.reason,
      bonusType: body.bonusType || 'other',
      recipientId: body.recipientId || user.userId,
      recipientName: body.recipientName || userDoc.name,
      reportedBy: user.userId,
      reportedByName: userDoc.name,
      date: body.date ? new Date(body.date) : new Date(),
      status: 'pending',
      notes: body.notes || undefined,
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Bonus',
        entityId: bonus._id.toString(),
        entityName: `แจ้งเหม๋อ: ${bonus.recipientName} - ${bonus.amount} บาท`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          amount: bonus.amount,
          reason: bonus.reason,
          bonusType: bonus.bonusType,
          recipientName: bonus.recipientName,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({ data: bonus }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
