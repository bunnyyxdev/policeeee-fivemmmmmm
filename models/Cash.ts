import mongoose, { Schema, Document } from 'mongoose';

export interface ICash extends Document {
  gameName: string;
  description: string;
  category: 'normal' | 'urgent' | 'emergency' | 'other';
  reportedBy: mongoose.Types.ObjectId;
  reportedByName: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'processed' | 'rejected';
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  imageUrl?: string; // URL ของรูปภาพ error จาก FiveM
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CashSchema: Schema = new Schema(
  {
    gameName: {
      type: String,
      required: [true, 'Game name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['normal', 'urgent', 'emergency', 'other'],
      default: 'normal',
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedByName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processed', 'rejected'],
      default: 'pending',
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    confirmedAt: {
      type: Date,
    },
    imageUrl: {
      type: String,
      trim: true,
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

CashSchema.index({ reportedBy: 1, date: -1 });
CashSchema.index({ status: 1, date: -1 });
CashSchema.index({ category: 1, date: -1 });
CashSchema.index({ date: -1 });

export default mongoose.models.Cash || mongoose.model<ICash>('Cash', CashSchema);
