import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { verifyTokenServer } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);
    const { searchParams } = new URL(request.url);
    
    const query: any = {};

    // Filter by action if provided
    const action = searchParams.get('action');
    if (action) {
      query.action = action;
    }

    // Filter by entityType if provided
    const entityType = searchParams.get('entityType');
    if (entityType) {
      query.entityType = entityType;
    }

    // Filter by performedBy if provided (all users can see all activities)
    const performedBy = searchParams.get('performedBy');
    if (performedBy) {
      query.performedBy = performedBy;
    }
    // All users can see all activity logs (no role-based filtering)

    // Filter by date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Include the entire end date by setting to end of day
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { entityName: { $regex: search, $options: 'i' } },
        { performedByName: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    const sortField = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const sortObject: any = {};
    sortObject[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      (ActivityLog as any).find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean()
        .populate('performedBy', 'name username role'),
      (ActivityLog as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: logs,
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

async function handlerDELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    await connectDB();

    // Get the current admin user for logging
    const currentAdmin = await (User as any).findById(decoded.userId);
    
    if (!currentAdmin) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ดูแลระบบ' }, { status: 404 });
    }

    // Count logs before deletion
    const logCountBefore = await (ActivityLog as any).countDocuments();

    // Delete all activity logs
    const deleteResult = await (ActivityLog as any).deleteMany({});

    // Log the deletion activity (this will be the only log entry after deletion)
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'delete',
        entityType: 'ActivityLog',
        entityId: 'all',
        entityName: 'All Activity Logs',
        performedBy: decoded.userId,
        performedByName: currentAdmin.name || decoded.userId,
        metadata: {
          deletedCount: deleteResult.deletedCount,
          totalBefore: logCountBefore,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      // Failed to log activity - continue anyway
    }

    return NextResponse.json({
      message: 'ลบ Activity Log ทั้งหมดสำเร็จ',
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const DELETE = handlerDELETE;