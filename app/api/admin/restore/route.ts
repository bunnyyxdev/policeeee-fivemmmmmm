import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth } from '@/lib/api-helpers';
import mongoose from 'mongoose';

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

    const body = await request.json();
    const { backup, clearExisting = false } = body;

    if (!backup || !backup.collections) {
      return NextResponse.json({ error: 'Invalid backup data' }, { status: 400 });
    }

    // Warning: This will overwrite existing data
    const restoredCollections: string[] = [];

    for (const [collectionName, documents] of Object.entries(backup.collections)) {
      const collection = db.collection(collectionName);
      
      if (clearExisting) {
        // Clear existing data
        await collection.deleteMany({});
      }

      if (Array.isArray(documents) && documents.length > 0) {
        // Insert documents
        await collection.insertMany(documents);
        restoredCollections.push(collectionName);
      }
    }

    // Log restore activity
    try {
      const { logActivity } = await import('@/lib/activity-log');
      await logActivity({
        action: 'update',
        entityType: 'Database',
        entityName: 'Database Restore',
        performedBy: user.userId,
        performedByName: user.name,
        metadata: {
          restoredCollections,
          clearExisting,
          backupVersion: backup.version,
          backupTimestamp: backup.timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to log restore activity:', error);
    }

    return NextResponse.json({
      success: true,
      message: `คืนค่าข้อมูลสำเร็จ: ${restoredCollections.length} collections`,
      restoredCollections,
    });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export const POST = requireAuth(handlerPOST);
