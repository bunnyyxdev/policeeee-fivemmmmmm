import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

async function handlerPUT(request: NextRequest, user: any) {
  try {
    await connectDB();

    const result = await Notification.updateMany(
      {
        recipient: user.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const PUT = requireAuth(handlerPUT);
