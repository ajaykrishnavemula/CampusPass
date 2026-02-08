import mongoose, { Schema, Document } from 'mongoose';
import { IOutpass, OutpassStatus } from '../types';

export interface OutpassDocument extends Omit<IOutpass, '_id'>, Document {}

const OutpassSchema = new Schema<OutpassDocument>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minlength: [10, 'Reason must be at least 10 characters'],
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    fromDate: {
      type: Date,
      required: [true, 'From date is required'],
    },
    toDate: {
      type: Date,
      required: [true, 'To date is required'],
      validate: {
        validator: function (this: OutpassDocument, value: Date) {
          return value > this.fromDate;
        },
        message: 'To date must be after from date',
      },
    },
    fromTime: {
      type: String,
      trim: true,
      default: null,
    },
    toTime: {
      type: String,
      trim: true,
      default: null,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      enum: ['home', 'medical', 'personal', 'emergency', 'other'],
    },
    emergencyContact: {
      type: String,
      required: [true, 'Emergency contact is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    contactNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'checked_out', 'checked_in', 'expired', 'cancelled', 'overdue'],
      default: OutpassStatus.PENDING,
    },
    warden: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    wardenRemarks: {
      type: String,
      trim: true,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    qrCode: {
      type: String,
      default: null,
    },
    qrCodeData: {
      type: String,
      default: null,
    },
    qrCodeExpiry: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    securityCheckOut: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    securityCheckIn: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    reminder1HourSent: {
      type: Boolean,
      default: false,
    },
    reminder30MinSent: {
      type: Boolean,
      default: false,
    },
    reminder5MinSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
OutpassSchema.index({ student: 1, createdAt: -1 });
OutpassSchema.index({ status: 1 });
OutpassSchema.index({ warden: 1 });
OutpassSchema.index({ fromDate: 1, toDate: 1 });
OutpassSchema.index({ isOverdue: 1 });
OutpassSchema.index({ qrCode: 1 });
OutpassSchema.index({ checkOutTime: -1 });
OutpassSchema.index({ checkInTime: -1 });

// Virtual for checking if outpass is currently active
OutpassSchema.virtual('isActive').get(function (this: OutpassDocument) {
  return (
    this.status === OutpassStatus.CHECKED_OUT &&
    new Date() <= this.toDate
  );
});

// Method to check if outpass is overdue
OutpassSchema.methods.checkOverdue = function (this: OutpassDocument) {
  if (
    this.status === OutpassStatus.CHECKED_OUT &&
    new Date() > this.toDate
  ) {
    this.isOverdue = true;
    return true;
  }
  return false;
};

export const Outpass = mongoose.model<OutpassDocument>('Outpass', OutpassSchema);

// 
