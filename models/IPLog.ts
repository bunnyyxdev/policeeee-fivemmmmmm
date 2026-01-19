import mongoose, { Schema, Document } from 'mongoose';

export interface IIPLog extends Document {
  userId?: mongoose.Types.ObjectId; // Optional - อาจเป็น anonymous user
  username?: string;
  ipAddress: string;
  userAgent?: string;
  path?: string; // Path ที่เข้าถึง
  method?: string; // HTTP method
  referer?: string; // Referer URL
  country?: string; // ประเทศ (ถ้ามี geolocation)
  city?: string; // เมือง (ถ้ามี geolocation)
  isp?: string; // ISP (ถ้ามี)
  device?: string; // Device type (mobile, desktop, tablet)
  browser?: string; // Browser name
  os?: string; // Operating system
  sessionId?: string; // Session ID
  isActive?: boolean; // ยังคง active อยู่หรือไม่
  lastActivity?: Date; // กิจกรรมล่าสุด
  createdAt: Date;
  updatedAt: Date;
}

const IPLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    username: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    path: {
      type: String,
      index: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    referer: {
      type: String,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    isp: {
      type: String,
    },
    device: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    sessionId: {
      type: String,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
IPLogSchema.index({ ipAddress: 1, createdAt: -1 });
IPLogSchema.index({ userId: 1, createdAt: -1 });
IPLogSchema.index({ createdAt: -1 });
IPLogSchema.index({ isActive: 1, lastActivity: -1 });
IPLogSchema.index({ path: 1, createdAt: -1 });

// Compound index for finding active sessions
IPLogSchema.index({ userId: 1, ipAddress: 1, isActive: 1 });

export default mongoose.models.IPLog || mongoose.model<IIPLog>('IPLog', IPLogSchema);
