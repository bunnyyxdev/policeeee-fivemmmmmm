import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  itemName: string;
  description?: string;
  category?: string;
  currentStock: number;
  unit: string;
  minStock?: number; // จำนวนขั้นต่ำที่ควรมี
  location?: string; // ตำแหน่งเก็บของ
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema: Schema = new Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: 'ชิ้น',
    },
    minStock: {
      type: Number,
      min: [0, 'Min stock cannot be negative'],
    },
    location: {
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

// Indexes for better query performance
// Note: itemName already has a unique index from unique: true, so we don't need to add it again
InventorySchema.index({ category: 1 });
InventorySchema.index({ currentStock: 1 });

export default mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
