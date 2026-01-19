import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyTokenServer } from '@/lib/auth';
import mongoose from 'mongoose';
import { logActivity } from '@/lib/activity-log';

// Mark route as dynamic since it uses MongoDB connection and request.headers
export const dynamic = 'force-dynamic';

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

    const results: any = {
      indexes: {},
      documents: {},
      stats: {},
    };

    // Update indexes
    try {
      const collections = mongoose.connection.collections;
      
      for (const collectionName in collections) {
        const collection = collections[collectionName];
        const indexes = await collection.indexes();
        
        // Drop duplicate indexes (except _id)
        for (const index of indexes) {
          if (index.name && index.name !== '_id_') {
            try {
              await collection.dropIndex(index.name);
            } catch (error: any) {
              // Ignore if index doesn't exist
            }
          }
        }
        
        // Recreate indexes for User model
        if (collectionName === 'users') {
          await User.createIndexes();
          const newIndexes = await collection.indexes();
          results.indexes[collectionName] = {
            count: newIndexes.length,
            indexes: newIndexes.map(idx => idx.name),
          };
        }
      }
    } catch (error: any) {
      results.indexes.error = error.message;
    }

    // Update documents
    try {
      // Update users without policeRank
      const userUpdate = await User.updateMany(
        { policeRank: { $exists: false } },
        { $set: { policeRank: null } }
      );
      
      results.documents.users = {
        updated: userUpdate.modifiedCount,
      };
    } catch (error: any) {
      results.documents.error = error.message;
    }

    // Get database stats
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collections = await db.listCollections().toArray();
        results.stats.collections = collections.length;
        
        const collectionStats: any = {};
        for (const collection of collections) {
          const count = await db.collection(collection.name).countDocuments();
          const indexes = await db.collection(collection.name).indexes();
          collectionStats[collection.name] = {
            documents: count,
            indexes: indexes.length,
          };
        }
        results.stats.details = collectionStats;
      }
    } catch (error: any) {
      results.stats.error = error.message;
    }

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const adminUser = await (User as any).findById(decoded.userId);
      
      await logActivity({
        action: 'update',
        entityType: 'Database',
        entityName: 'Database Update',
        performedBy: decoded.userId,
        performedByName: adminUser?.name || decoded.userId,
        metadata: {
          indexesUpdated: Object.keys(results.indexes).length,
          documentsUpdated: results.documents.users?.updated || 0,
          collections: results.stats.collections || 0,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Database updated successfully',
      results,
    });
  } catch (error: any) {
    console.error('Update DB error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
