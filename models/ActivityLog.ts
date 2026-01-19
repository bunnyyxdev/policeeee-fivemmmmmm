import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'approve' | 'reject';
  entityType: string; // เช่น 'User', 'Leave', 'Discipline', etc.
  entityId: mongoose.Types.ObjectId;
  entityName?: string; // ชื่อหรือข้อมูลที่อ้างอิงง่าย เช่น ชื่อตำรวจ, หัวข้อการลา
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>; // ข้อมูลเพิ่มเติม
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'login', 'logout', 'view', 'approve', 'reject'],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    entityName: {
      type: String,
      trim: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    performedByName: {
      type: String,
      required: true,
    },
    changes: [{
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
    }],
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ performedBy: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, entityId: 1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ performedBy: 1, action: 1, createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
