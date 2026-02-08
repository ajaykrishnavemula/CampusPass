import { Outpass } from '../models';
import { OutpassStatus } from '../types';
import { logger } from '../utils/logger';
import { NotificationService } from './NotificationService';
import { EmailService } from './EmailService';

export class ReminderService {
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Check for upcoming returns and send reminders
   */
  static async checkUpcomingReturns(): Promise<void> {
    try {
      const now = new Date();
      
      // Find checked-out outpasses that need reminders
      const outpasses = await Outpass.find({
        status: OutpassStatus.CHECKED_OUT,
        toDate: { $gte: now }, // Not yet overdue
      }).populate('student');
      
      for (const outpass of outpasses) {
        const returnTime = new Date(outpass.toDate);
        const timeUntilReturn = returnTime.getTime() - now.getTime();
        const minutesUntilReturn = Math.floor(timeUntilReturn / (60 * 1000));
        
        // Check if we should send a reminder
        // Use a 2-minute window to avoid missing reminders
        if (minutesUntilReturn <= 62 && minutesUntilReturn >= 58 && !outpass.reminder1HourSent) {
          await this.send1HourReminder(outpass);
        } else if (minutesUntilReturn <= 32 && minutesUntilReturn >= 28 && !outpass.reminder30MinSent) {
          await this.send30MinReminder(outpass);
        } else if (minutesUntilReturn <= 7 && minutesUntilReturn >= 3 && !outpass.reminder5MinSent) {
          await this.send5MinReminder(outpass);
        }
      }
      
      logger.info(`Checked ${outpasses.length} active outpasses for return reminders`);
    } catch (error) {
      logger.error('Error checking upcoming returns:', error);
    }
  }

  /**
   * Send 1-hour reminder
   */
  private static async send1HourReminder(outpass: any): Promise<void> {
    try {
      const student = outpass.student as any;
      
      // Create notification
      await NotificationService.createNotification(
        student._id.toString(),
        '⏰ Return Reminder - 1 Hour',
        `Your outpass expires in 1 hour. Please start heading back to campus. Return time: ${new Date(outpass.toDate).toLocaleString()}`,
        'warning',
        outpass._id.toString()
      );
      
      // Send email
      await EmailService.sendReturnReminder(
        student.email,
        student.name,
        outpass.toJSON(),
        '1 hour'
      );
      
      // Mark as sent
      outpass.reminder1HourSent = true;
      await outpass.save();
      
      logger.info(`Sent 1-hour reminder for outpass ${outpass._id}`);
    } catch (error) {
      logger.error(`Failed to send 1-hour reminder for outpass ${outpass._id}:`, error);
    }
  }

  /**
   * Send 30-minute reminder
   */
  private static async send30MinReminder(outpass: any): Promise<void> {
    try {
      const student = outpass.student as any;
      
      // Create notification
      await NotificationService.createNotification(
        student._id.toString(),
        '⚠️ Return Reminder - 30 Minutes',
        `Your outpass expires in 30 minutes! Please return to campus immediately. Return time: ${new Date(outpass.toDate).toLocaleString()}`,
        'warning',
        outpass._id.toString()
      );
      
      // Send email
      await EmailService.sendReturnReminder(
        student.email,
        student.name,
        outpass.toJSON(),
        '30 minutes'
      );
      
      // Mark as sent
      outpass.reminder30MinSent = true;
      await outpass.save();
      
      logger.info(`Sent 30-minute reminder for outpass ${outpass._id}`);
    } catch (error) {
      logger.error(`Failed to send 30-minute reminder for outpass ${outpass._id}:`, error);
    }
  }

  /**
   * Send 5-minute reminder
   */
  private static async send5MinReminder(outpass: any): Promise<void> {
    try {
      const student = outpass.student as any;
      
      // Create notification
      await NotificationService.createNotification(
        student._id.toString(),
        '🚨 URGENT - Return in 5 Minutes!',
        `Your outpass expires in 5 minutes! You must return NOW to avoid being marked overdue. Return time: ${new Date(outpass.toDate).toLocaleString()}`,
        'error',
        outpass._id.toString()
      );
      
      // Send email
      await EmailService.sendReturnReminder(
        student.email,
        student.name,
        outpass.toJSON(),
        '5 minutes'
      );
      
      // Mark as sent
      outpass.reminder5MinSent = true;
      await outpass.save();
      
      logger.info(`Sent 5-minute reminder for outpass ${outpass._id}`);
    } catch (error) {
      logger.error(`Failed to send 5-minute reminder for outpass ${outpass._id}:`, error);
    }
  }

  /**
   * Start the background reminder checker
   */
  static startReminderChecker(): void {
    if (this.intervalId) {
      logger.warn('Reminder checker already running');
      return;
    }
    
    // Run immediately on start
    this.checkUpcomingReturns();
    
    // Then run every 2 minutes (to catch all reminder windows)
    this.intervalId = setInterval(() => {
      this.checkUpcomingReturns();
    }, 2 * 60 * 1000);
    
    logger.info('✅ Return reminder checker started (runs every 2 minutes)');
  }

  /**
   * Stop the background reminder checker
   */
  static stopReminderChecker(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Reminder checker stopped');
    }
  }
}

// 