import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WithdrawItem from '@/models/WithdrawItem';
import User from '@/models/User';
import { verifyTokenServer } from '@/lib/auth';
import { handleApiError } from '@/lib/api-helpers';
import { logActivity, detectChanges } from '@/lib/activity-log';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = { userId: decoded.userId, role: decoded.role };
    
    await connectDB();

    // All users can view any withdraw item
    const item = await (WithdrawItem as any).findById(params.id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = { userId: decoded.userId, role: decoded.role };
    
    await connectDB();

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const query: any = { _id: params.id };
    if (user.role !== 'admin') {
      query.withdrawnBy = user.userId;
    }

    // Get old data for change detection
    const oldItem = await (WithdrawItem as any).findOne(query);
    if (!oldItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    const oldItemData = oldItem.toObject();

    const body = await request.json();
    const item = await (WithdrawItem as any).findOneAndUpdate(query, body, { new: true, runValidators: true });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      const changes = detectChanges(oldItemData, item.toObject(), ['_id', '__v', 'createdAt', 'updatedAt']);
      
      await logActivity({
        action: 'update',
        entityType: 'WithdrawItem',
        entityId: item._id.toString(),
        entityName: `แก้ไขการเบิก: ${item.itemName}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        changes: changes.length > 0 ? changes : undefined,
        metadata: {
          itemName: item.itemName,
          quantity: item.quantity,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({ data: item });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = { userId: decoded.userId, role: decoded.role };
    
    await connectDB();

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const query: any = { _id: params.id };
    if (user.role !== 'admin') {
      query.withdrawnBy = user.userId;
    }

    const item = await (WithdrawItem as any).findOne(query);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const itemName = item.itemName;
    const itemId = item._id.toString();

    await (WithdrawItem as any).findOneAndDelete(query);

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'delete',
        entityType: 'WithdrawItem',
        entityId: itemId,
        entityName: `ลบการเบิก: ${itemName}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          itemName: itemName,
          quantity: item.quantity,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    return handleApiError(error);
  }
}
