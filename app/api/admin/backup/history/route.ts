import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Backup from '@/models/Backup';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const { page, limit, skip, sort } = parseQueryParams(request);
    const { searchParams } = new URL(request.url);
    const isAutomatic = searchParams.get('isAutomatic');
    const status = searchParams.get('status');

    const query: any = {};

    if (isAutomatic !== null) {
      query.isAutomatic = isAutomatic === 'true';
    }

    if (status) {
      query.status = status;
    }

    const [backups, total] = await Promise.all([
      (Backup as any).find(query)
        .sort(sort || '-timestamp')
        .skip(skip)
        .limit(limit)
        .lean()
        .populate('createdBy', 'name username'),
      (Backup as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: backups,
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

export const GET = requireAuth(handlerGET);
