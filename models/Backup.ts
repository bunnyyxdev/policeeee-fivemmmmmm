import mongoose, { Schema, Document } from 'mongoose';

export interface IBackup extends Document {
  version: string;
  timestamp: Date;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  collections: Record<string, any[]>;
  fileName?: string;
  fileSize?: number;
  isAutomatic: boolean;
  scheduleId?: string;
  status: 'completed' | 'failed' | 'in-progress';
  error?: string;
  metadata?: {
    totalCollections?: number;
    totalDocuments?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BackupSchema = new Schema<IBackup>(
  {
    version: {
      type: String,
      default: '1.0',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    collections: {
      type: Schema.Types.Mixed,
      default: {},
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    isAutomatic: {
      type: Boolean,
      default: false,
    },
    scheduleId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['completed', 'failed', 'in-progress'],
      default: 'completed',
    },
    error: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BackupSchema.index({ timestamp: -1 });
BackupSchema.index({ createdBy: 1 });
BackupSchema.index({ isAutomatic: 1 });
BackupSchema.index({ status: 1 });
BackupSchema.index({ scheduleId: 1 });

const Backup = mongoose.models.Backup || mongoose.model<IBackup>('Backup', BackupSchema);

export default Backup;
