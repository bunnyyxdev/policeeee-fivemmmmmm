import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Suggestion from '@/models/Suggestion';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { saveSuggestionToSheet } from '@/lib/google-sheets-helpers';
import { sendDiscordNotification } from '@/lib/discord-webhook';
import { logActivity } from '@/lib/activity-log';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { submittedByName: { $regex: search, $options: 'i' } },
      ];
    }

    // All users can see all suggestions

    const [suggestions, total] = await Promise.all([
      (Suggestion as any).find(query)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Suggestion as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: suggestions,
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
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (หัวข้อ, เนื้อหา)' },
        { status: 400 }
      );
    }

    const suggestion = await (Suggestion as any).create({
      title: body.title,
      content: body.content,
      category: body.category || 'other',
      submittedBy: user.userId,
      submittedByName: userDoc.name,
      status: 'pending',
      isAnonymous: body.isAnonymous || false,
      likes: [],
      likesCount: 0,
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Suggestion',
        entityId: suggestion._id.toString(),
        entityName: suggestion.title,
        performedBy: user.userId,
        performedByName: suggestion.isAnonymous ? 'ไม่ระบุชื่อ' : userDoc.name,
        metadata: {
          category: suggestion.category,
          isAnonymous: suggestion.isAnonymous,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    // Backup to Google Sheets with template
    try {
      await saveSuggestionToSheet({
        ...suggestion.toObject(),
        submittedByName: userDoc.name,
      });
    } catch (error) {
      console.error('Failed to backup to Google Sheets:', error);
    }

    // Send Discord notification with complete information
    try {
      let discordMessage = `**หัวข้อ:** ${suggestion.title}\n`;
      discordMessage += `**เนื้อหา:** ${suggestion.content}\n`;
      discordMessage += `**หมวดหมู่:** ${getCategoryLabel(suggestion.category)}\n`;
      discordMessage += `**เสนอโดย:** ${suggestion.isAnonymous ? 'ไม่ระบุชื่อ' : userDoc.name}\n`;
      discordMessage += `**สถานะ:** ${getStatusLabel(suggestion.status)}\n`;
      discordMessage += `**วันที่เสนอ:** ${new Date(suggestion.createdAt).toLocaleString('th-TH')}\n`;

      await sendDiscordNotification(
        '💡 เสนอความคิดเห็นใหม่',
        discordMessage,
        0x9b59b6, // Purple color for suggestions
        'feedback'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return NextResponse.json({ data: suggestion }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    improvement: 'การปรับปรุง',
    bug: 'บั๊ก/ข้อผิดพลาด',
    feature: 'ฟีเจอร์ใหม่',
    other: 'อื่นๆ',
  };
  return labels[category] || category;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'รอตรวจสอบ',
    'under-review': 'กำลังตรวจสอบ',
    approved: 'อนุมัติ',
    rejected: 'ปฏิเสธ',
    implemented: 'ดำเนินการแล้ว',
  };
  return labels[status] || status;
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
