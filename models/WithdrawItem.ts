import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawItem extends Document {
  itemName: string;
  quantity: number;
  unit?: string;
  withdrawnBy: mongoose.Types.ObjectId;
  withdrawnByName: string;
  notes?: string;
  imageUrl?: string; // URL ของรูปภาพที่อัพโหลด
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawItemSchema: Schema = new Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      trim: true,
      default: 'ชิ้น',
    },
    withdrawnBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    withdrawnByName: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
WithdrawItemSchema.index({ createdAt: -1 });
WithdrawItemSchema.index({ withdrawnBy: 1, createdAt: -1 });
WithdrawItemSchema.index({ itemName: 1, createdAt: -1 });

export default mongoose.models.WithdrawItem || mongoose.model<IWithdrawItem>('WithdrawItem', WithdrawItemSchema);
