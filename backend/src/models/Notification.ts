import mongoose, { Schema, Document } from 'mongoose';
import { INotification } from '../types';

export interface NotificationDocument extends Omit<INotification, '_id'>, Document {}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    relatedOutpass: {
      type: Schema.Types.ObjectId,
      ref: 'Outpass',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1 });

export const Notification = mongoose.model<NotificationDocument>(
  'Notification',
  NotificationSchema
);

// 
