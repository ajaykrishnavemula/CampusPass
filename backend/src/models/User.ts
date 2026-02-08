import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole } from '../types';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: Number,
      enum: Object.values(UserRole).filter((v) => typeof v === 'number'),
      default: UserRole.STUDENT,
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    rollNumber: {
      type: String,
      sparse: true,
      uppercase: true,
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
    },
    hostel: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    parentPhone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    overdueCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminWarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    canCreateOutpass: {
      type: Boolean,
      default: true,
    },
    lastOverdueDate: {
      type: Date,
      default: null,
    },
    // Admin-specific fields for student restriction management
    overrideCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastOverrideDate: {
      type: Date,
      default: null,
    },
    lastOverrideBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    restrictionStatus: {
      type: String,
      enum: ['none', 'restricted', 'overridden'],
      default: 'none',
    },
    // Security personnel fields
    assignedGate: {
      type: String,
      trim: true,
      default: null,
    },
    assignedHostel: {
      type: String,
      trim: true,
      default: null,
    },
    // Warden fields - multiple hostel assignment
    assignedHostels: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as any).password;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
// Note: email and rollNumber already have unique indexes from schema definition
UserSchema.index({ role: 1 });
UserSchema.index({ hostel: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ restrictionStatus: 1 });
UserSchema.index({ overdueCount: 1 });
UserSchema.index({ overrideCount: 1 });
UserSchema.index({ lastOverrideDate: -1 });
UserSchema.index({ assignedHostels: 1 }); // For warden hostel queries

export const User = mongoose.model<UserDocument>('User', UserSchema);

// 
