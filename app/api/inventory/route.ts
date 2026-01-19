import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { logActivity, detectChanges } from '@/lib/activity-log';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      (Inventory as any).find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      (Inventory as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: items,
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
    // Only admin can create inventory items
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const item = await (Inventory as any).create(body);

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Inventory',
        entityId: item._id.toString(),
        entityName: `เพิ่มสินค้า: ${item.itemName}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          itemName: item.itemName,
          currentStock: item.currentStock,
          unit: item.unit,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'ชื่อสินค้านี้มีอยู่ในระบบแล้ว' }, { status: 400 });
    }
    return handleApiError(error);
  }
}

async function handlerPUT(request: NextRequest, user: any) {
  try {
    // Only admin can update inventory
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { itemName, ...updateData } = body;

    if (!itemName) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get old data for change detection
    const oldItem = await (Inventory as any).findOne({ itemName });
    if (!oldItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    const oldItemData = oldItem.toObject();

    const item = await (Inventory as any).findOneAndUpdate(
      { itemName },
      updateData,
      { new: true, runValidators: true }
    );

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
        entityType: 'Inventory',
        entityId: item._id.toString(),
        entityName: `แก้ไขสินค้า: ${item.itemName}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        changes: changes.length > 0 ? changes : undefined,
        metadata: {
          itemName: item.itemName,
          currentStock: item.currentStock,
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

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
export const PUT = requireAuth(handlerPUT);
