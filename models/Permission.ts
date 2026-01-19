import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  code: string; // Unique permission code (e.g., 'users.create', 'leaves.approve')
  category: string; // Category/Module (e.g., 'users', 'leaves', 'discipline')
  description?: string;
  isSystem: boolean; // System permissions cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PermissionSchema.index({ category: 1 });
// Note: code field already has unique: true, which creates an index automatically

const Permission = mongoose.models.Permission || mongoose.model<IPermission>('Permission', PermissionSchema);

export default Permission;
