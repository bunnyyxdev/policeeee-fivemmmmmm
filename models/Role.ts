import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  code: string; // Unique role code (e.g., 'admin', 'officer', 'supervisor', 'editor')
  description?: string;
  permissions: mongoose.Types.ObjectId[]; // Array of Permission IDs
  isSystem: boolean; // System roles cannot be deleted
  isDefault: boolean; // Default role for new users
  createdBy?: mongoose.Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [{
      type: Schema.Types.ObjectId,
      ref: 'Permission',
    }],
    isSystem: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdByName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: code field already has unique: true, which creates an index automatically
RoleSchema.index({ isSystem: 1 });
RoleSchema.index({ isDefault: 1 });

const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

export default Role;
