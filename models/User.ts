import mongoose, { Schema, Document } from 'mongoose';

export type PoliceRank = 
  | '10' // ผู้บัญชาการตำรวจ
  | '09' // รองผู้บัญชาการตำรวจ
  | '08' // ผู้ช่วยผู้บัญชาการตำรวจ
  | '07' // หัวหน้าตำรวจ
  | '06' // รองหัวหน้าตำรวจ
  | '05' // เลขานุการตำรวจ
  | '04' // ตำรวจชำนาญ
  | '03' // ตำรวจปี 3
  | '02' // ตำรวจปี 2
  | '01' // ตำรวจปี 1
  | '00'; // นักเรียนตำรวจ

export type DriverLicenseType = '1' | '2' | '3'; // Type 1 - พื้นฐาน, Type 2 - ขั้นกลาง, Type 3 - ขั้นสูง

export interface IUser extends Document {
  username: string;
  password: string;
  name: string;
  policeRank?: PoliceRank;
  profileImage?: string;
  driverLicense?: string; // หมายเลขใบขับขี่
  driverLicenseType?: DriverLicenseType; // Type ของใบอนุญาตขับฮอ
  role: 'officer' | 'admin'; // Legacy role field (kept for backward compatibility)
  customRole?: mongoose.Types.ObjectId; // Reference to custom Role
  permissions?: mongoose.Types.ObjectId[]; // Additional permissions (can override role permissions)
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      index: true,
    },
    policeRank: {
      type: String,
      enum: ['10', '09', '08', '07', '06', '05', '04', '03', '02', '01', '00'],
      trim: true,
      index: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    driverLicense: {
      type: String,
      trim: true,
    },
    driverLicenseType: {
      type: String,
      enum: ['1', '2', '3'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['officer', 'admin'],
      default: 'officer',
    },
    customRole: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    permissions: [{
      type: Schema.Types.ObjectId,
      ref: 'Permission',
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
UserSchema.index({ createdAt: -1 });
UserSchema.index({ role: 1, createdAt: -1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
