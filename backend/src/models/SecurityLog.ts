import mongoose, { Schema, Document } from 'mongoose';

export interface SecurityLogDocument extends Document {
  outpass: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  security: mongoose.Types.ObjectId;
  action: 'check_out' | 'check_in' | 'invalid_scan';
  timestamp: Date;
  result: 'success' | 'failed' | 'overdue';
  reason?: string;
  qrCode?: string;
  metadata?: {
    hostel?: string;
    destination?: string;
    expectedReturn?: Date;
    actualReturn?: Date;
    overdueMinutes?: number;
  };
}

const SecurityLogSchema = new Schema<SecurityLogDocument>(
  {
    outpass: {
      type: Schema.Types.ObjectId,
      ref: 'Outpass',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    security: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['check_out', 'check_in', 'invalid_scan'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    result: {
      type: String,
      enum: ['success', 'failed', 'overdue'],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    qrCode: {
      type: String,
      default: null,
    },
    metadata: {
      hostel: String,
      destination: String,
      expectedReturn: Date,
      actualReturn: Date,
      overdueMinutes: Number,
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
SecurityLogSchema.index({ security: 1, timestamp: -1 });
SecurityLogSchema.index({ student: 1, timestamp: -1 });
SecurityLogSchema.index({ outpass: 1 });
SecurityLogSchema.index({ action: 1, timestamp: -1 });
SecurityLogSchema.index({ result: 1 });
SecurityLogSchema.index({ timestamp: -1 });

export const SecurityLog = mongoose.model<SecurityLogDocument>('SecurityLog', SecurityLogSchema);

// 