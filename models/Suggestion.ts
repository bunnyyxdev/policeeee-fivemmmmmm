import mongoose, { Schema, Document } from 'mongoose';

export interface ISuggestion extends Document {
  title: string;
  content: string;
  category: 'improvement' | 'bug' | 'feature' | 'other';
  submittedBy: mongoose.Types.ObjectId;
  submittedByName: string;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'implemented';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  isAnonymous: boolean;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SuggestionSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['improvement', 'bug', 'feature', 'other'],
      default: 'other',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedByName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under-review', 'approved', 'rejected', 'implemented'],
      default: 'pending',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedByName: {
      type: String,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likesCount: {
      type: Number,
      default: 0,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    attachments: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

SuggestionSchema.index({ status: 1, createdAt: -1 });
SuggestionSchema.index({ submittedBy: 1, createdAt: -1 });
SuggestionSchema.index({ category: 1, createdAt: -1 });
SuggestionSchema.index({ likesCount: -1, createdAt: -1 });

// Auto-update likesCount
SuggestionSchema.pre('save', function (next) {
  if (this.isModified('likes')) {
    const doc = this as unknown as ISuggestion;
    doc.likesCount = doc.likes.length;
  }
  next();
});

export default mongoose.models.Suggestion || mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
