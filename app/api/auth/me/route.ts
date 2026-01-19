import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyTokenServer, hashPassword, verifyPassword, isPasswordTooSimilar } from '@/lib/auth';

// Mark route as dynamic since it uses request.headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    const user = await (User as any).findById(decoded.userId).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert user to plain object and ensure dates are properly serialized
    const userObj = user.toObject();
    if (userObj.createdAt) {
      userObj.createdAt = userObj.createdAt instanceof Date 
        ? userObj.createdAt.toISOString() 
        : userObj.createdAt;
    }
    if (userObj.updatedAt) {
      userObj.updatedAt = userObj.updatedAt instanceof Date 
        ? userObj.updatedAt.toISOString() 
        : userObj.updatedAt;
    }

    return NextResponse.json({ user: userObj });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token with better handling
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.trim() || '';
    
    // Clean the token - handle both "Bearer token" and just "token" formats
    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.substring(7).trim();
    }

    if (!token) {
      console.log('PUT /api/auth/me: No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate token format before verification
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('PUT /api/auth/me: Invalid token format - expected 3 parts, got:', tokenParts.length);
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);

    if (!decoded) {
      console.log('PUT /api/auth/me: Token verification failed');
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 30) + '...');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('PUT /api/auth/me: Token decoded successfully', { userId: decoded.userId, role: decoded.role });

    await connectDB();
    const body = await request.json();

    // Handle password change separately
    if (body.currentPassword && body.newPassword) {
      const user = await (User as any).findById(decoded.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verify current password
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');
      let isValidPassword = false;

      if (isHashed) {
        isValidPassword = await verifyPassword(body.currentPassword, user.password);
      } else {
        isValidPassword = body.currentPassword === user.password;
      }

      if (!isValidPassword) {
        return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
      }

      // Validate new password
      if (body.newPassword.length < 8) {
        return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
      }

      // Check if new password is too similar to current password
      if (isPasswordTooSimilar(body.newPassword, body.currentPassword)) {
        return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบันอย่างน้อย 30%' }, { status: 400 });
      }

      // Update password
      const hashedPassword = await hashPassword(body.newPassword);
      user.password = hashedPassword;
      await user.save();

      // Return updated user without password
      const userObj = user.toObject();
      delete userObj.password;
      if (userObj.createdAt) {
        userObj.createdAt = userObj.createdAt instanceof Date 
          ? userObj.createdAt.toISOString() 
          : userObj.createdAt;
      }
      if (userObj.updatedAt) {
        userObj.updatedAt = userObj.updatedAt instanceof Date 
          ? userObj.updatedAt.toISOString() 
          : userObj.updatedAt;
      }

      return NextResponse.json({ user: userObj });
    }

    // Only allow updating profile image (other fields are read-only)
    const allowedFields = ['profileImage'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const user = await (User as any).findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert user to plain object and ensure dates are properly serialized
    const userObj = user.toObject();
    if (userObj.createdAt) {
      userObj.createdAt = userObj.createdAt instanceof Date 
        ? userObj.createdAt.toISOString() 
        : userObj.createdAt;
    }
    if (userObj.updatedAt) {
      userObj.updatedAt = userObj.updatedAt instanceof Date 
        ? userObj.updatedAt.toISOString() 
        : userObj.updatedAt;
    }

    return NextResponse.json({ user: userObj });
  } catch (error: any) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
