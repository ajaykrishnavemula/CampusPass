import mongoose, { Schema, Document } from 'mongoose';

export interface SystemSettingsDocument extends Document {
  // System Status
  systemStatus: 'active' | 'inactive';
  
  // General Settings
  siteName: string;
  maxOutpassDuration: number; // in days
  qrCodeExpiry: number; // in hours
  overdueCheckInterval: number; // in minutes
  
  // Policy Settings
  overdueThreshold: number; // number of overdues before restriction
  autoRejectionDays?: number; // auto-reject after X days (optional)
  autoApprovalEnabled: boolean;
  
  // Feature Toggles
  notificationsEnabled: boolean;
  qrEnforcementEnabled: boolean; // always true, read-only
  
  // Metadata
  lastUpdatedBy?: mongoose.Types.ObjectId;
  lastUpdatedAt?: Date;
}

const SystemSettingsSchema = new Schema<SystemSettingsDocument>(
  {
    systemStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    siteName: {
      type: String,
      default: 'Campus Pass Management System',
      trim: true,
    },
    maxOutpassDuration: {
      type: Number,
      default: 7, // 7 days
      min: 1,
      max: 30,
    },
    qrCodeExpiry: {
      type: Number,
      default: 24, // 24 hours
      min: 1,
      max: 168, // 1 week
    },
    overdueCheckInterval: {
      type: Number,
      default: 15, // 15 minutes
      min: 5,
      max: 60,
    },
    overdueThreshold: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    autoRejectionDays: {
      type: Number,
      default: null,
      min: 1,
      max: 30,
    },
    autoApprovalEnabled: {
      type: Boolean,
      default: false,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    qrEnforcementEnabled: {
      type: Boolean,
      default: true,
      immutable: true, // Cannot be changed
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastUpdatedAt: {
      type: Date,
      default: null,
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

// Ensure only one settings document exists
SystemSettingsSchema.index({ _id: 1 }, { unique: true });

export const SystemSettings = mongoose.model<SystemSettingsDocument>(
  'SystemSettings',
  SystemSettingsSchema
);

// 