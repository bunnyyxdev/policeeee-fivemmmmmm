import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort } = parseQueryParams(request);
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');

    const query: any = {
      recipient: user.userId,
    };

    if (isRead !== null) {
      query.isRead = isRead === 'true';
    }

    if (type) {
      query.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      (Notification as any).find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      (Notification as any).countDocuments(query),
      (Notification as any).countDocuments({ ...query, isRead: false }),
    ]);

    return NextResponse.json({
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function handlerPOST(request: NextRequest, user: any) {
  try {
    await connectDB();
    const body = await request.json();

    const notification = await (Notification as any).create({
      ...body,
      recipient: body.recipient || user.userId,
    });

    return NextResponse.json({ data: notification }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
