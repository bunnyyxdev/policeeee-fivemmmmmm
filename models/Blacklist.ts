import mongoose, { Schema, Document } from 'mongoose';

export interface IBlacklist extends Document {
  name: string;
  reason: string;
  category: 'patient' | 'visitor' | 'vendor' | 'other';
  severity: 'low' | 'medium' | 'high';
  addedBy: mongoose.Types.ObjectId;
  addedByName: string;
  isActive: boolean;
  expiresAt?: Date;
  notes?: string;
  fineAmount?: number;
  paymentStatus?: 'unpaid' | 'paid';
  paidAt?: Date;
  paidBy?: mongoose.Types.ObjectId;
  paidByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlacklistSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['patient', 'visitor', 'vendor', 'other'],
      default: 'other',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    addedByName: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    fineAmount: {
      type: Number,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
      index: true,
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    paidByName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

BlacklistSchema.index({ isActive: 1, createdAt: -1 });
BlacklistSchema.index({ name: 1, isActive: 1 });
BlacklistSchema.index({ category: 1, isActive: 1 });
BlacklistSchema.index({ expiresAt: 1 });

export default mongoose.models.Blacklist || mongoose.model<IBlacklist>('Blacklist', BlacklistSchema);
