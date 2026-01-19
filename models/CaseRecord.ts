import mongoose, { Schema, Document } from 'mongoose';

export interface ICaseRecord extends Document {
  caseNumber: string; // หมายเลขคดี (auto-generated)
  caseDate: Date; // วันที่เกิดคดี
  incidentDate?: Date; // วันที่เกิดเหตุ
  incidentLocation?: string; // สถานที่เกิดเหตุ
  
  // ข้อมูลผู้กระทำผิด
  suspectName?: string;
  suspectId?: string; // รหัสบัตรประชาชน
  suspectAge?: number;
  suspectAddress?: string;
  suspectPhone?: string;
  
  // ข้อมูลผู้เสียหาย
  victimName?: string;
  victimId?: string;
  victimAge?: number;
  victimAddress?: string;
  victimPhone?: string;
  
  // รายละเอียดคดี
  caseType: string; // ประเภทคดี
  caseCategory: 'criminal' | 'civil' | 'traffic' | 'other'; // หมวดหมู่คดี
  description: string; // รายละเอียดคดี
  status: 'open' | 'investigating' | 'prosecuted' | 'closed' | 'dismissed'; // สถานะคดี
  priority: 'low' | 'medium' | 'high' | 'critical'; // ความสำคัญ
  
  // ตำรวจผู้รับผิดชอบ
  assignedOfficer?: mongoose.Types.ObjectId;
  assignedOfficerName?: string;
  investigatingOfficers?: mongoose.Types.ObjectId[]; // ตำรวจผู้สืบสวน
  investigatingOfficerNames?: string[];
  
  // ผู้บันทึก
  recordedBy: mongoose.Types.ObjectId;
  recordedByName: string;
  
  // เอกสารและรูปภาพ
  documents?: string[]; // URL เอกสาร
  images?: string[]; // URL รูปภาพ
  
  // ข้อมูลการจับกุม
  arrestName?: string; // ชื่อ-นามสกุล
  arrestIdCard?: string; // เลขบัตรประชาชน
  crimeType?: string; // คดีที่โดนจับ
  fineAmount?: number; // ค่าปรับ
  jailTime?: string; // เวลาติดคุก
  arrestImages?: string[]; // รูปตอนจับพร้อมบัตร (Max 10MB)
  
  // หมายเหตุ
  notes?: string;
  
  // วันที่ปิดคดี
  closedDate?: Date;
  closedBy?: mongoose.Types.ObjectId;
  closedByName?: string;
  closureReason?: string; // เหตุผลที่ปิดคดี
  
  createdAt: Date;
  updatedAt: Date;
}

const CaseRecordSchema: Schema = new Schema(
  {
    caseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    caseDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    incidentDate: {
      type: Date,
    },
    incidentLocation: {
      type: String,
      trim: true,
    },
    
    // ข้อมูลผู้กระทำผิด
    suspectName: {
      type: String,
      trim: true,
    },
    suspectId: {
      type: String,
      trim: true,
      index: true,
    },
    suspectAge: {
      type: Number,
    },
    suspectAddress: {
      type: String,
      trim: true,
    },
    suspectPhone: {
      type: String,
      trim: true,
    },
    
    // ข้อมูลผู้เสียหาย
    victimName: {
      type: String,
      trim: true,
    },
    victimId: {
      type: String,
      trim: true,
    },
    victimAge: {
      type: Number,
    },
    victimAddress: {
      type: String,
      trim: true,
    },
    victimPhone: {
      type: String,
      trim: true,
    },
    
    // รายละเอียดคดี
    caseType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    caseCategory: {
      type: String,
      enum: ['criminal', 'civil', 'traffic', 'other'],
      default: 'criminal',
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'prosecuted', 'closed', 'dismissed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    
    // ตำรวจผู้รับผิดชอบ
    assignedOfficer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedOfficerName: {
      type: String,
    },
    investigatingOfficers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    investigatingOfficerNames: [{
      type: String,
    }],
    
    // ผู้บันทึก
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordedByName: {
      type: String,
      required: true,
    },
    
    // เอกสารและรูปภาพ
    documents: [{
      type: String,
    }],
    images: [{
      type: String,
    }],
    
    // ข้อมูลการจับกุม
    arrestName: {
      type: String,
      trim: true,
    },
    arrestIdCard: {
      type: String,
      trim: true,
    },
    crimeType: {
      type: String,
      trim: true,
    },
    fineAmount: {
      type: Number,
    },
    jailTime: {
      type: String,
      trim: true,
    },
    arrestImages: [{
      type: String,
    }],
    
    // หมายเหตุ
    notes: {
      type: String,
      trim: true,
    },
    
    // วันที่ปิดคดี
    closedDate: {
      type: Date,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    closedByName: {
      type: String,
    },
    closureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: caseNumber already has unique: true which creates an index automatically
CaseRecordSchema.index({ caseDate: -1 });
CaseRecordSchema.index({ status: 1, priority: 1, caseDate: -1 });
CaseRecordSchema.index({ recordedBy: 1, createdAt: -1 });
CaseRecordSchema.index({ assignedOfficer: 1, status: 1 });
CaseRecordSchema.index({ caseCategory: 1, caseDate: -1 });
CaseRecordSchema.index({ suspectName: 1 });
CaseRecordSchema.index({ victimName: 1 });

export default mongoose.models.CaseRecord || mongoose.model<ICaseRecord>('CaseRecord', CaseRecordSchema);
