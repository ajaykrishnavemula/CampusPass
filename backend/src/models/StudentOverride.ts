import mongoose, { Schema, Document } from 'mongoose';

export interface StudentOverrideDocument extends Document {
  student: mongoose.Types.ObjectId;
  admin: mongoose.Types.ObjectId;
  reason: string;
  overrideType: 'restriction_lifted' | 'overdue_reset' | 'manual_approval';
  previousState: {
    overdueCount: number;
    canCreateOutpass: boolean;
    restrictionStatus: string;
  };
  newState: {
    overdueCount: number;
    canCreateOutpass: boolean;
    restrictionStatus: string;
  };
  timestamp: Date;
  expiresAt?: Date; // Optional: if override is temporary
  isActive: boolean;
}

const StudentOverrideSchema = new Schema<StudentOverrideDocument>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required for override'],
      trim: true,
      minlength: [10, 'Reason must be at least 10 characters'],
      immutable: true,
    },
    overrideType: {
      type: String,
      enum: ['restriction_lifted', 'overdue_reset', 'manual_approval'],
      required: true,
      immutable: true,
    },
    previousState: {
      overdueCount: {
        type: Number,
        required: true,
      },
      canCreateOutpass: {
        type: Boolean,
        required: true,
      },
      restrictionStatus: {
        type: String,
        required: true,
      },
    },
    newState: {
      overdueCount: {
        type: Number,
        required: true,
      },
      canCreateOutpass: {
        type: Boolean,
        required: true,
      },
      restrictionStatus: {
        type: String,
        required: true,
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
StudentOverrideSchema.index({ student: 1, timestamp: -1 });
StudentOverrideSchema.index({ admin: 1, timestamp: -1 });
StudentOverrideSchema.index({ isActive: 1 });
StudentOverrideSchema.index({ timestamp: -1 });

// Prevent modification of override records (audit trail)
StudentOverrideSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified()) {
    const modifiedPaths = this.modifiedPaths();
    // Only allow isActive to be modified
    const allowedModifications = ['isActive'];
    const hasUnallowedModifications = modifiedPaths.some(
      (path) => !allowedModifications.includes(path)
    );
    
    if (hasUnallowedModifications) {
      return next(new Error('Override records cannot be modified (audit trail)'));
    }
  }
  next();
});

export const StudentOverride = mongoose.model<StudentOverrideDocument>(
  'StudentOverride',
  StudentOverrideSchema
);

// 