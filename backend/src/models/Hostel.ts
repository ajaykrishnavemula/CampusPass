import mongoose, { Schema, Document } from 'mongoose';

export interface IHostel extends Document {
  name: string;
  code: string;
  type: 'boys' | 'girls' | 'mixed';
  capacity: number;
  currentOccupancy: number;
  warden?: mongoose.Types.ObjectId;
  address: string;
  contactNumber: string;
  facilities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HostelSchema = new Schema<IHostel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['boys', 'girls', 'mixed'],
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    warden: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    address: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    facilities: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// Note: code already has unique index from schema definition
HostelSchema.index({ type: 1 });
HostelSchema.index({ isActive: 1 });

export const Hostel = mongoose.model<IHostel>('Hostel', HostelSchema);

// 