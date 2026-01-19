import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Backup from '@/models/Backup';
import { requireAuth } from '@/lib/api-helpers';
import mongoose from 'mongoose';
import { logActivity } from '@/lib/activity-log';

async function handlerPOST(request: NextRequest, user: any) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Get all collections
    const collections = await db.listCollections().toArray();
    const backupData: Record<string, any[]> = {};

    // Backup all collections
    for (const collection of collections) {
      const collectionName = collection.name;
      const data = await db.collection(collectionName).find({}).toArray();
      backupData[collectionName] = data;
    }

    const userDoc = await (User as any).findById(user.userId);
    const userName = userDoc?.name || 'Unknown';

    const body = await request.json().catch(() => ({}));
    const { scheduleId, isAutomatic = false } = body;

    // Calculate total documents
    let totalDocuments = 0;
    Object.values(backupData).forEach((docs: any) => {
      if (Array.isArray(docs)) {
        totalDocuments += docs.length;
      }
    });

    const backupObj = {
      version: '1.0',
      timestamp: new Date(),
      createdBy: user.userId,
      createdByName: userName,
      collections: backupData,
      isAutomatic: isAutomatic || false,
      scheduleId: scheduleId || undefined,
      status: 'completed' as const,
      metadata: {
        totalCollections: collections.length,
        totalDocuments,
      },
    };

    // Save backup to MongoDB for history
    try {
      await (Backup as any).create(backupObj);
    } catch (error) {
      console.error('Failed to save backup to MongoDB:', error);
      // Continue even if saving to MongoDB fails
    }

    // Keep original format for response (with ISO string timestamp)
    const backup = {
      ...backupObj,
      timestamp: backupObj.timestamp.toISOString(),
    };

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Database',
        entityName: 'Database Backup',
        performedBy: user.userId,
        performedByName: userName,
        metadata: {
          collections: collections.length,
          version: backup.version,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({
      success: true,
      backup,
      message: `สำรองข้อมูลสำเร็จ: ${collections.length} collections`,
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export const POST = requireAuth(handlerPOST);
