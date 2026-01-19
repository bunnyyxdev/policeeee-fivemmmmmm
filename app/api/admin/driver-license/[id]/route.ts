import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyTokenServer } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { driverLicenseType } = body;

    // Verify token and get user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyTokenServer(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    await connectDB();

    // Validate driverLicenseType if provided
    if (driverLicenseType !== null && driverLicenseType !== undefined && !['1', '2', '3'].includes(driverLicenseType)) {
      return NextResponse.json(
        { error: 'Invalid driverLicenseType. Must be 1, 2, or 3' },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await (User as any).findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update driverLicenseType
    if (driverLicenseType !== null && driverLicenseType !== undefined) {
      user.driverLicenseType = driverLicenseType;
    } else {
      user.driverLicenseType = undefined;
    }

    await user.save();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: driverLicenseType ? 'Driver license issued successfully' : 'Driver license revoked successfully',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        driverLicenseType: user.driverLicenseType,
      },
    });
  } catch (error: any) {
    console.error('Error updating driver license:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update driver license' },
      { status: 500 }
    );
  }
}
