import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  leaveDate: Date;
  leaveType: 'sick' | 'personal' | 'vacation' | 'emergency' | 'other';
  reason: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  requestedBy: mongoose.Types.ObjectId;
  requestedByName: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema(
  {
    leaveDate: {
      type: Date,
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ['sick', 'personal', 'vacation', 'emergency', 'other'],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    duration: {
      type: Number,
      required: true,
      min: [0.5, 'Duration must be at least 0.5 days'],
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedByName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedByName: {
      type: String,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    attachments: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

LeaveSchema.index({ requestedBy: 1, startDate: 1 });
LeaveSchema.index({ status: 1, startDate: 1 });
LeaveSchema.index({ leaveType: 1, startDate: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 });

// Calculate duration before saving
LeaveSchema.pre('save', function (next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    const doc = this as unknown as ILeave;
    const startDate = doc.startDate as Date;
    const endDate = doc.endDate as Date;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    doc.duration = diffDays;
  }
  next();
});

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
