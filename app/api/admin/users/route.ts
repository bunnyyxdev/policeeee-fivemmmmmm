import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyTokenServer, hashPassword } from '@/lib/auth';
import { sendDiscordNotification } from '@/lib/discord-webhook';
import { logActivity } from '@/lib/activity-log';
import mongoose from 'mongoose';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);

    // Allow both admin and officer to get user list
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'officer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    
    // Get actual database name being used
    const actualDbName = mongoose.connection.db?.databaseName;
    
    const users = await (User as any).find().select('-password').sort({ createdAt: -1 }).lean();

    // Ensure all _id fields are properly serialized as strings
    const serializedUsers = users.map((user: any) => ({
      ...user,
      _id: user._id.toString(),
    }));

    return NextResponse.json({ 
      users: serializedUsers,
      _dbName: actualDbName // Database name for debugging
    });
  } catch (error: any) {
    // Provide more specific error messages
    if (error.name === 'MongooseServerSelectionError' || error.message?.includes('MongoDB')) {
      return NextResponse.json({ 
        error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ - กรุณาตรวจสอบการตั้งค่า MongoDB' 
      }, { status: 503 });
    }
    
    // Return detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Internal server error: ${error.message || 'Unknown error'}`
      : 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { username, password, name, policeRank, role } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await (User as any).findOne({ username });

    if (existingUser) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await (User as any).create({
      username,
      password: hashedPassword,
      name,
      policeRank: policeRank || undefined,
      role: role || 'officer',
    });

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const adminUser = await (User as any).findById(decoded.userId);
      
      await logActivity({
        action: 'create',
        entityType: 'User',
        entityId: user._id.toString(),
        entityName: user.name,
        performedBy: decoded.userId,
        performedByName: adminUser?.name || decoded.userId,
        metadata: {
          username: user.username,
          policeRank: user.policeRank,
          role: user.role,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      // Failed to log activity
    }

    // Send Discord notification with complete information
    try {
      let discordMessage = `**ชื่อ:** ${name}\n`;
      discordMessage += `**ชื่อผู้ใช้:** ${username}\n`;
      // ไม่แสดงอีเมลถ้าไม่มี
      if (policeRank) {
        discordMessage += `**ยศตำรวจ:** ${policeRank}\n`;
      }
      discordMessage += `**บทบาท:** ${role === 'admin' ? 'ผู้ดูแลระบบ' : 'ตำรวจ'}\n`;
      discordMessage += `**สร้างโดย:** Admin\n`;
      discordMessage += `**วันที่สร้าง:** ${new Date().toLocaleString('th-TH')}\n`;

      await sendDiscordNotification(
        '👤 ผู้ใช้ใหม่ถูกสร้าง',
        discordMessage,
        0x2ecc71, // Green
        'admin'
      );
    } catch (error) {
      // Failed to send Discord notification
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        policeRank: user.policeRank,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - ไม่พบ token' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);

    if (!decoded) {
      return NextResponse.json({ 
        error: 'Token ไม่ถูกต้องหรือหมดอายุ - กรุณาเข้าสู่ระบบใหม่',
        code: 'INVALID_TOKEN'
      }, { status: 401 });
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - ต้องเป็นผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    await connectDB();

    // Get the current admin user to exclude from deletion
    const currentAdmin = await (User as any).findById(decoded.userId);
    
    if (!currentAdmin) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ดูแลระบบ' }, { status: 404 });
    }

    // Count users before deletion for verification
    const userCountBefore = await (User as any).countDocuments();
    
    // Delete all users except the current admin
    const deleteResult = await (User as any).deleteMany({
      _id: { $ne: decoded.userId }
    });
    
    // Verify deletion
    const userCountAfter = await (User as any).countDocuments();

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'delete',
        entityType: 'User',
        entityId: 'all',
        entityName: 'All Users',
        performedBy: decoded.userId,
        performedByName: currentAdmin.name || decoded.userId,
        metadata: {
          deletedCount: deleteResult.deletedCount,
          preservedAdmin: currentAdmin.username,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      // Failed to log activity
    }

    // Send Discord notification
    try {
      await sendDiscordNotification(
        '🗑️ ลบผู้ใช้ทั้งหมด',
        `**จำนวนผู้ใช้ที่ถูกลบ:** ${deleteResult.deletedCount}\n**ผู้ดูแลระบบที่ยังคงอยู่:** ${currentAdmin.name} (${currentAdmin.username})\n**ดำเนินการโดย:** ${currentAdmin.name}\n**วันที่:** ${new Date().toLocaleString('th-TH')}`,
        0xe74c3c, // Red
        'admin'
      );
    } catch (error) {
      // Failed to send Discord notification
    }

    return NextResponse.json({
      message: 'ลบผู้ใช้ทั้งหมดสำเร็จ',
      deletedCount: deleteResult.deletedCount,
      userCountBefore,
      userCountAfter,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
