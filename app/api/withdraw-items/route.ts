import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WithdrawItem from '@/models/WithdrawItem';
import Inventory from '@/models/Inventory';
import User from '@/models/User';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { saveWithdrawItemToSheet } from '@/lib/google-sheets-helpers';
import { sendDiscordNotification } from '@/lib/discord-webhook';
import { logActivity } from '@/lib/activity-log';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { withdrawnByName: { $regex: search, $options: 'i' } },
      ];
    }

    // All users can see all withdraw items

    const [items, total] = await Promise.all([
      (WithdrawItem as any).find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      (WithdrawItem as any).countDocuments(query),
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
    await connectDB();
    const body = await request.json();

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check inventory stock if item exists and update
    let inventoryItem = null;
    let stockUpdated = false;
    let newStock = 0;
    let oldStock = 0;
    
    if (body.itemName) {
      inventoryItem = await (Inventory as any).findOne({ itemName: body.itemName });
      if (inventoryItem) {
        oldStock = inventoryItem.currentStock;
        
        // Check if enough stock available
        if (inventoryItem.currentStock < body.quantity) {
          return NextResponse.json(
            { 
              error: `สต๊อกไม่พอ: มีสต๊อก ${inventoryItem.currentStock} ${inventoryItem.unit || 'ชิ้น'} แต่ต้องการ ${body.quantity} ${inventoryItem.unit || 'ชิ้น'}`,
              availableStock: inventoryItem.currentStock,
              requestedQuantity: body.quantity
            },
            { status: 400 }
          );
        }

        // Warn if stock is low (below minStock)
        if (inventoryItem.minStock && inventoryItem.currentStock - body.quantity < inventoryItem.minStock) {
          // Still allow withdrawal but warn
          console.warn(`Low stock warning: ${body.itemName} will be below minimum stock after withdrawal`);
        }

        // Deduct stock immediately
        inventoryItem.currentStock -= body.quantity;
        if (inventoryItem.currentStock < 0) {
          inventoryItem.currentStock = 0; // Prevent negative stock
        }
        newStock = inventoryItem.currentStock;
        await inventoryItem.save();
        stockUpdated = true;
        console.log(`Stock updated for ${body.itemName}: ${oldStock} -> ${newStock}`);
      }
    }

    const item = await (WithdrawItem as any).create({
      ...body,
      withdrawnBy: user.userId,
      withdrawnByName: userDoc.name,
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'WithdrawItem',
        entityId: item._id.toString(),
        entityName: `เบิกของ: ${item.itemName} (${item.quantity} ${item.unit || 'ชิ้น'})`,
        performedBy: user.userId,
        performedByName: userDoc.name,
        metadata: {
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          stockUpdated: stockUpdated,
          oldStock: oldStock,
          newStock: newStock,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    // Backup to Google Sheets with template
    try {
      await saveWithdrawItemToSheet({
        ...item.toObject(),
        withdrawnByName: userDoc.name,
      });
    } catch (error) {
      console.error('Failed to backup to Google Sheets:', error);
    }

    // Send Discord notification with complete information
    try {
      let discordMessage = `**ผู้เบิก:** ${userDoc.name}\n`;
      discordMessage += `**ของที่เบิก:** ${item.itemName}\n`;
      discordMessage += `**จำนวน:** ${item.quantity} ${item.unit || 'ชิ้น'}\n`;
      discordMessage += `**วันที่เบิก:** ${new Date(item.createdAt).toLocaleString('th-TH')}\n`;
      
      if (stockUpdated && inventoryItem) {
        discordMessage += `**สต๊อกหลังเบิก:** ${newStock} ${inventoryItem.unit || body.unit || 'ชิ้น'}\n`;
      }
      
      if (item.notes) {
        discordMessage += `**หมายเหตุ:** ${item.notes}\n`;
      }

      // Get full image URL for Discord
      let imageUrl = item.imageUrl;
      if (imageUrl && !imageUrl.startsWith('http')) {
        // Priority: NEXT_PUBLIC_BASE_URL > VERCEL_URL > provided Vercel URL > default Vercel URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
          || 'https://Policecccccccc-fivemmmmmm.vercel.app';
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      await sendDiscordNotification(
        '📦 เบิกของใหม่',
        discordMessage,
        0x3498db, // Blue
        'withdrawals',
        imageUrl
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
