import mongoose, { Schema, Document } from 'mongoose';

export interface IBonus extends Document {
  amount: number;
  reason: string;
  bonusType: 'performance' | 'holiday' | 'special' | 'other';
  recipientId?: mongoose.Types.ObjectId;
  recipientName: string;
  reportedBy: mongoose.Types.ObjectId;
  reportedByName: string;
  date: Date;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BonusSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    bonusType: {
      type: String,
      enum: ['performance', 'holiday', 'special', 'other'],
      default: 'other',
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedByName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

BonusSchema.index({ recipientId: 1, date: -1 });
BonusSchema.index({ recipientName: 1, date: -1 });
BonusSchema.index({ status: 1, date: -1 });
BonusSchema.index({ bonusType: 1, date: -1 });
BonusSchema.index({ reportedBy: 1, date: -1 });

export default mongoose.models.Bonus || mongoose.model<IBonus>('Bonus', BonusSchema);
