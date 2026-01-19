import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cash from '@/models/Cash';
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
        { gameName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reportedByName: { $regex: search, $options: 'i' } },
      ];
    }

    // All users can see all cash records

    const [cashRecords, total] = await Promise.all([
      (Cash as any).find(query)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Cash as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: cashRecords,
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
    if (!body.gameName || !body.description) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อเกม, รายละเอียด)' },
        { status: 400 }
      );
    }

    const cash = await (Cash as any).create({
      gameName: body.gameName,
      description: body.description,
      category: body.category || 'normal',
      reportedBy: user.userId,
      reportedByName: userDoc.name,
      date: body.date ? new Date(body.date) : new Date(),
      imageUrl: body.imageUrl || undefined,
      status: 'pending',
      notes: body.notes || undefined,
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Cash',
        entityId: cash._id.toString(),
        entityName: `แคชออกจากเกม: ${cash.gameName}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          gameName: cash.gameName,
          description: cash.description,
          category: cash.category,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({ data: cash }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
