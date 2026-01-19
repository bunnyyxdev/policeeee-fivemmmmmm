import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyTokenServer, hashPassword } from '@/lib/auth';
import { logActivity, detectChanges } from '@/lib/activity-log';
import mongoose from 'mongoose';

// Mark route as dynamic since it uses MongoDB connection and request.headers
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if params or params.id exists
    if (!params || !params.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const user = await (User as any).findById(params.id).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Convert to plain object and ensure _id is a string
    const userObj = user.toObject ? user.toObject() : user;
    userObj._id = userObj._id.toString();
    
    return NextResponse.json({ user: userObj });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { name, username, policeRank, role, password, profileImage } = body;

    const user = await (User as any).findById(params.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save old data for change detection
    const oldUserData = user.toObject();

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await (User as any).findOne({ username });
      if (existingUser) {
        return NextResponse.json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' }, { status: 400 });
      }
      user.username = username;
    }

    if (name) {
      user.name = name;
    }

    if (policeRank !== undefined) {
      user.policeRank = policeRank || undefined;
    }

    if (role) {
      user.role = role;
    }

    if (profileImage !== undefined) {
      user.profileImage = profileImage || undefined;
    }

    // Handle password update if provided
    if (password && password.length > 0) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
      }
      user.password = await hashPassword(password);
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const adminUser = await (User as any).findById(decoded.userId);
      
      const changes = detectChanges(oldUserData, userObj, ['_id', '__v', 'password', 'createdAt', 'updatedAt']);
      
      await logActivity({
        action: 'update',
        entityType: 'User',
        entityId: user._id.toString(),
        entityName: user.name,
        performedBy: decoded.userId,
        performedByName: adminUser?.name || decoded.userId,
        changes: changes.length > 0 ? changes : undefined,
        metadata: {
          username: user.username,
          role: user.role,
          passwordChanged: !!(password && password.length > 0),
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      // Failed to log activity
    }

    return NextResponse.json({ user: userObj });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const user = await (User as any).findById(params.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userName = user.name;
    const userId = user._id.toString();

    await (User as any).findByIdAndDelete(params.id);

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const adminUser = await (User as any).findById(decoded.userId);
      
      await logActivity({
        action: 'delete',
        entityType: 'User',
        entityId: userId,
        entityName: userName,
        performedBy: decoded.userId,
        performedByName: adminUser?.name || decoded.userId,
        metadata: {
          deletedUsername: user.username,
          deletedRole: user.role,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      // Failed to log activity
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
