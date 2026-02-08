import mongoose, { Schema, Document } from 'mongoose';

export interface AdminActionLogDocument extends Document {
  admin: mongoose.Types.ObjectId;
  action: string;
  targetType: 'user' | 'outpass' | 'settings' | 'system';
  targetId?: mongoose.Types.ObjectId;
  details: {
    before?: any;
    after?: any;
    reason?: string;
    metadata?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AdminActionLogSchema = new Schema<AdminActionLogDocument>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    action: {
      type: String,
      required: true,
      immutable: true,
      enum: [
        // User actions
        'user_created',
        'user_updated',
        'user_deleted',
        'user_status_toggled',
        'user_restriction_overridden',
        'user_unlocked',
        'outpass_permission_toggled',
        // Outpass actions
        'outpass_status_overridden',
        'outpass_deleted',
        // Settings actions
        'settings_updated',
        'system_status_changed',
        // System actions
        'bulk_operation',
        'data_export',
      ],
    },
    targetType: {
      type: String,
      required: true,
      immutable: true,
      enum: ['user', 'outpass', 'settings', 'system'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
      immutable: true,
    },
    details: {
      before: {
        type: Schema.Types.Mixed,
        default: null,
      },
      after: {
        type: Schema.Types.Mixed,
        default: null,
      },
      reason: {
        type: String,
        trim: true,
        default: null,
      },
      metadata: {
        type: Schema.Types.Mixed,
        default: null,
      },
    },
    ipAddress: {
      type: String,
      default: null,
      immutable: true,
    },
    userAgent: {
      type: String,
      default: null,
      immutable: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: false, // Using custom timestamp field
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
AdminActionLogSchema.index({ admin: 1, timestamp: -1 });
AdminActionLogSchema.index({ action: 1, timestamp: -1 });
AdminActionLogSchema.index({ targetType: 1, targetId: 1 });
AdminActionLogSchema.index({ timestamp: -1 });

// Make all fields immutable after creation
AdminActionLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Admin action logs cannot be modified'));
  }
  next();
});

export const AdminActionLog = mongoose.model<AdminActionLogDocument>(
  'AdminActionLog',
  AdminActionLogSchema
);

// 