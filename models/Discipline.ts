import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscipline extends Document {
  officerName: string;
  officerId?: mongoose.Types.ObjectId;
  violation: string;
  violationDate?: Date;
  penalty: string;
  penaltyType: 'warning' | 'suspension' | 'fine' | 'termination' | 'other';
  penaltyAmount?: number;
  issuedBy: mongoose.Types.ObjectId;
  issuedByName: string;
  status: 'pending' | 'issued' | 'appealed' | 'resolved';
  appealReason?: string;
  resolvedAt?: Date;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DisciplineSchema: Schema = new Schema(
  {
    officerName: {
      type: String,
      required: [true, 'Officer name is required'],
      trim: true,
      index: true,
    },
    officerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    violation: {
      type: String,
      required: [true, 'Violation description is required'],
      trim: true,
    },
    violationDate: {
      type: Date,
      default: Date.now,
    },
    penalty: {
      type: String,
      required: [true, 'Penalty description is required'],
      trim: true,
    },
    penaltyType: {
      type: String,
      enum: ['warning', 'suspension', 'fine', 'termination', 'other'],
      required: true,
      index: true,
    },
    penaltyAmount: {
      type: Number,
      min: [0, 'Penalty amount cannot be negative'],
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issuedByName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'issued', 'appealed', 'resolved'],
      default: 'pending',
    },
    appealReason: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

DisciplineSchema.index({ officerName: 1, createdAt: -1 });
DisciplineSchema.index({ officerId: 1, createdAt: -1 });
DisciplineSchema.index({ status: 1, createdAt: -1 });
DisciplineSchema.index({ penaltyType: 1, createdAt: -1 });
DisciplineSchema.index({ issuedBy: 1, createdAt: -1 });

export default mongoose.models.Discipline || mongoose.model<IDiscipline>('Discipline', DisciplineSchema);
