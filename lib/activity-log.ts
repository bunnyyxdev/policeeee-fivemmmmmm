import connectDB from './mongodb';
import ActivityLog from '@/models/ActivityLog';
import mongoose from 'mongoose';

export interface LogActivityParams {
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'approve' | 'reject';
  entityType: string;
  entityId?: string;
  entityName?: string;
  performedBy: string;
  performedByName: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * บันทึกการกระทำสำคัญของผู้ใช้
 */
export async function logActivity(params: LogActivityParams) {
  try {
    await connectDB();

    // Validate entityId - only include if it's a valid ObjectId
    let entityId: string | undefined = undefined;
    if (params.entityId && mongoose.Types.ObjectId.isValid(params.entityId)) {
      entityId = params.entityId;
    }

    // For login actions, check for duplicate entries within the last 5 seconds
    // This prevents double logging from duplicate requests or React strict mode
    if (params.action === 'login') {
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      
      const duplicateQuery: any = {
        action: 'login',
        performedBy: params.performedBy,
        createdAt: { $gte: fiveSecondsAgo },
      };
      
      // Only include entityId in query if it's valid
      if (entityId) {
        duplicateQuery.entityId = entityId;
      }
      
      const recentDuplicate = await (ActivityLog as any).findOne(duplicateQuery).sort({ createdAt: -1 });

      if (recentDuplicate) {
        // Duplicate found within 5 seconds - skip logging
        return recentDuplicate;
      }
    }

    const activityLog = await (ActivityLog as any).create({
      action: params.action,
      entityType: params.entityType,
      entityId: entityId,
      entityName: params.entityName,
      performedBy: params.performedBy,
      performedByName: params.performedByName,
      changes: params.changes || undefined,
      metadata: params.metadata || undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return activityLog;
  } catch (error) {
    // Don't throw error to prevent breaking main operations
    return null;
  }
}

/**
 * Helper function to detect changes between old and new objects
 */
export function detectChanges(oldObj: any, newObj: any, excludeFields: string[] = ['_id', '__v', 'createdAt', 'updatedAt']): Array<{ field: string; oldValue: any; newValue: any }> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
  
  // Check for new/changed fields
  for (const key in newObj) {
    if (excludeFields.includes(key)) continue;
    
    if (oldObj[key] !== newObj[key]) {
      changes.push({
        field: key,
        oldValue: oldObj[key],
        newValue: newObj[key],
      });
    }
  }
  
  // Check for deleted fields
  for (const key in oldObj) {
    if (excludeFields.includes(key)) continue;
    
    if (!(key in newObj)) {
      changes.push({
        field: key,
        oldValue: oldObj[key],
        newValue: null,
      });
    }
  }
  
  return changes;
}
