import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeTracking extends Document {
  caregiverName: string;
  caredForPerson: string; // ผู้ที่รับดูแล
  date: Date;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  recordedByName: string;
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const TimeTrackingSchema: Schema = new Schema(
  {
    caregiverName: {
      type: String,
      required: [true, 'Caregiver name is required'],
      trim: true,
      index: true,
    },
    caredForPerson: {
      type: String,
      required: [true, 'Cared for person is required'],
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
    },
    duration: {
      type: Number, // in minutes
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordedByName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

TimeTrackingSchema.index({ date: -1, caregiverName: 1 });
TimeTrackingSchema.index({ recordedBy: 1, date: -1 });
TimeTrackingSchema.index({ status: 1, date: -1 });

export default mongoose.models.TimeTracking || mongoose.model<ITimeTracking>('TimeTracking', TimeTrackingSchema);
