import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const { search } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const roles = await (Role as any).find(query)
      .sort({ isSystem: -1, name: 1 })
      .populate('permissions', 'name code category')
      .lean();

    return NextResponse.json({
      data: roles,
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
    const { name, code, description, permissions, isDefault } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อและรหัสบทบาท' },
        { status: 400 }
      );
    }

    // Check if role code already exists
    const existingRole = await (Role as any).findOne({ code: code.toLowerCase() });
    if (existingRole) {
      return NextResponse.json(
        { error: 'รหัสบทบาทนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    // If setting as default, unset other default roles
    if (isDefault) {
      await (Role as any).updateMany({ isDefault: true }, { isDefault: false });
    }

    const userDoc = await (User as any).findById(user.userId);
    const userName = userDoc?.name || 'Unknown';

    const role = await (Role as any).create({
      name,
      code: code.toLowerCase(),
      description,
      permissions: permissions || [],
      isSystem: false,
      isDefault: isDefault || false,
      createdBy: user.userId,
      createdByName: userName,
    });

    const populatedRole = await (Role as any).findById(role._id)
      .populate('permissions', 'name code category')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedRole,
      message: 'สร้างบทบาทสำเร็จ',
    }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
