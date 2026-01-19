import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Permission from '@/models/Permission';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const { page, limit, skip, sort, search, category } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const [permissions, total] = await Promise.all([
      (Permission as any).find(query)
        .sort(sort || 'category')
        .skip(skip)
        .limit(limit)
        .lean(),
      (Permission as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: permissions,
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
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, code, category, description } = body;

    if (!name || !code || !category) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อ รหัส และหมวดหมู่' },
        { status: 400 }
      );
    }

    // Check if permission code already exists
    const existingPermission = await (Permission as any).findOne({ code: code.toLowerCase() });
    if (existingPermission) {
      return NextResponse.json(
        { error: 'รหัสสิทธิ์นี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    const permission = await (Permission as any).create({
      name,
      code: code.toLowerCase(),
      category,
      description,
      isSystem: false,
    });

    return NextResponse.json({
      success: true,
      data: permission,
      message: 'สร้างสิทธิ์สำเร็จ',
    }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
