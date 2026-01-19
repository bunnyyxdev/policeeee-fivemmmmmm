import mongoose, { Schema, Document } from 'mongoose';

export interface IBackupSchedule extends Document {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number; // 1-31 for monthly
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  retentionDays?: number; // Keep backups for X days (optional, delete after)
  collections?: string[]; // Specific collections to backup (optional, all if empty)
  createdAt: Date;
  updatedAt: Date;
}

const BackupScheduleSchema = new Schema<IBackupSchedule>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    time: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastRun: {
      type: Date,
    },
    nextRun: {
      type: Date,
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
    retentionDays: {
      type: Number,
      min: 1,
    },
    collections: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BackupScheduleSchema.index({ isActive: 1, nextRun: 1 });
BackupScheduleSchema.index({ createdBy: 1 });

const BackupSchedule = mongoose.models.BackupSchedule || mongoose.model<IBackupSchedule>('BackupSchedule', BackupScheduleSchema);

export default BackupSchedule;
