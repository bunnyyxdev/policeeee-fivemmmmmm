import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blacklist from '@/models/Blacklist';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { sendDiscordNotification } from '@/lib/discord-webhook';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();

    const { page, limit, search, sort } = parseQueryParams(request);

    const query: any = {};

    // Show all blacklist entries for all users (no role-based filtering)

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await (Blacklist as any).countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * limit;

    const blacklist = await (Blacklist as any)
      .find(query)
      .sort(sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: blacklist.map((item: any) => ({
        _id: item._id.toString(),
        name: item.name,
        reason: item.reason,
        category: item.category,
        severity: item.severity,
        addedBy: item.addedBy.toString(),
        addedByName: item.addedByName,
        isActive: item.isActive,
        expiresAt: item.expiresAt,
        notes: item.notes,
        fineAmount: item.fineAmount,
        paymentStatus: item.paymentStatus || 'unpaid',
        paidAt: item.paidAt,
        paidBy: item.paidBy?.toString(),
        paidByName: item.paidByName,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
    const { name, charge, reason, fineAmount, category, severity, expiresAt, notes } = body;

    if (!name || !charge) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อและข้อหา' },
        { status: 400 }
      );
    }

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Combine charge and reason
    const fullReason = charge + (reason ? `\n\nรายละเอียดเพิ่มเติม: ${reason}` : '');

    const blacklistItem = await (Blacklist as any).create({
      name: name.trim(),
      reason: fullReason,
      category: category || 'other',
      severity: severity || 'medium',
      addedBy: user.userId,
      addedByName: userDoc.name,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      notes: notes?.trim(),
      fineAmount: fineAmount ? parseFloat(fineAmount) : undefined,
      paymentStatus: 'unpaid',
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await logActivity({
        action: 'create',
        entityType: 'Blacklist',
        entityId: blacklistItem._id.toString(),
        entityName: `Blacklist: ${blacklistItem.name}`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          name: blacklistItem.name,
          category: blacklistItem.category,
          severity: blacklistItem.severity,
          fineAmount: blacklistItem.fineAmount,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      // Failed to log activity - continue anyway
    }

    // Send Discord notification
    try {
      let discordMessage = `**ชื่อ:** ${blacklistItem.name}\n`;
      discordMessage += `**ข้อหา:** ${charge}\n`;
      
      if (reason) {
        discordMessage += `**รายละเอียดเพิ่มเติม:** ${reason}\n`;
      }
      
      if (blacklistItem.fineAmount) {
        discordMessage += `**ค่าปรับ:** ${blacklistItem.fineAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท\n`;
      }
      
      discordMessage += `**หมวดหมู่:** ${blacklistItem.category}\n`;
      discordMessage += `**ระดับความรุนแรง:** ${blacklistItem.severity}\n`;
      discordMessage += `**เพิ่มโดย:** ${userDoc.name}\n`;
      discordMessage += `**วันที่:** ${new Date(blacklistItem.createdAt).toLocaleString('th-TH')}\n`;
      
      if (blacklistItem.expiresAt) {
        discordMessage += `**วันหมดอายุ:** ${new Date(blacklistItem.expiresAt).toLocaleDateString('th-TH')}\n`;
      }
      
      if (notes) {
        discordMessage += `**หมายเหตุ:** ${notes}\n`;
      }

      await sendDiscordNotification(
        '🚫 เพิ่มรายการ Blacklist ใหม่',
        discordMessage,
        0xe74c3c, // Red color
        'blacklist'
      );
    } catch (error) {
      // Failed to send Discord notification - continue anyway
    }

    return NextResponse.json(
      {
        message: 'เพิ่มรายการ Blacklist สำเร็จ',
        data: {
          _id: blacklistItem._id.toString(),
          name: blacklistItem.name,
          reason: blacklistItem.reason,
          category: blacklistItem.category,
          severity: blacklistItem.severity,
          addedBy: blacklistItem.addedBy.toString(),
          addedByName: blacklistItem.addedByName,
          isActive: blacklistItem.isActive,
          expiresAt: blacklistItem.expiresAt,
          notes: blacklistItem.notes,
          fineAmount: blacklistItem.fineAmount,
          paymentStatus: blacklistItem.paymentStatus || 'unpaid',
          paidAt: blacklistItem.paidAt,
          paidBy: blacklistItem.paidBy?.toString(),
          paidByName: blacklistItem.paidByName,
          createdAt: blacklistItem.createdAt,
          updatedAt: blacklistItem.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
