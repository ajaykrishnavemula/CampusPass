import { Outpass, User, SystemSettings } from '../models';
import { OutpassStatus } from '../types';
import { logger } from '../utils/logger';
import { NotificationService } from './NotificationService';

export class OverdueService {
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Check for overdue outpasses and mark them
   */
  static async checkOverdueOutpasses(): Promise<void> {
    try {
      const settings = await SystemSettings.findOne();
      const overdueCheckInterval = settings?.overdueCheckInterval || 60;
      
      // Calculate cutoff time
      const cutoffTime = new Date(Date.now() - overdueCheckInterval * 60 * 1000);
      
      // Find overdue outpasses
      const overdueOutpasses = await Outpass.find({
        status: OutpassStatus.CHECKED_OUT,
        toDate: { $lt: cutoffTime },
      }).populate('student');
      
      logger.info(`Found ${overdueOutpasses.length} overdue outpasses`);
      
      for (const outpass of overdueOutpasses) {
        await this.markAsOverdue(outpass._id.toString());
      }
    } catch (error) {
      logger.error('Error checking overdue outpasses:', error);
    }
  }

  /**
   * Mark a specific outpass as overdue and update user
   */
  static async markAsOverdue(outpassId: string): Promise<void> {
    try {
      const outpass = await Outpass.findById(outpassId).populate('student');
      if (!outpass) return;
      
      // Mark outpass as overdue
      outpass.status = OutpassStatus.OVERDUE;
      await outpass.save();
      
      // Update user
      const user = await User.findById(outpass.student);
      if (!user) return;
      
      user.overdueCount += 1;
      user.lastOverdueDate = new Date();
      
      if (user.overdueCount >= 3) {
        user.canCreateOutpass = false;
      }
      
      await user.save();
      
      logger.info(`Marked outpass ${outpassId} as overdue. User ${user.email} overdueCount: ${user.overdueCount}`);
      
      // Create notification for student using NotificationService
      await NotificationService.notifyOverdue(
        user._id.toString(),
        outpassId
      );
      
      // Create notification for admins
      const admins = await User.find({ role: 1 });
      for (const admin of admins) {
        await NotificationService.createNotification(
          admin._id.toString(),
          'Student Overdue Alert',
          `Student ${user.name} (${user.email}) has an overdue outpass. Total overdue count: ${user.overdueCount}`,
          'warning',
          outpassId
        );
      }
      
      // If user is blocked, send critical notification
      if (user.overdueCount >= 3) {
        await NotificationService.createNotification(
          user._id.toString(),
          'Account Restricted',
          'You have exceeded the maximum overdue limit (3). You cannot create new outpasses. Please contact admin.',
          'error'
        );
      }
    } catch (error) {
      logger.error(`Error marking outpass ${outpassId} as overdue:`, error);
    }
  }

  /**
   * Start the background overdue checker
   */
  static startOverdueChecker(): void {
    if (this.intervalId) {
      logger.warn('Overdue checker already running');
      return;
    }
    
    // Run immediately on start
    this.checkOverdueOutpasses();
    
    // Then run every 15 minutes
    this.intervalId = setInterval(() => {
      this.checkOverdueOutpasses();
    }, 15 * 60 * 1000);
    
    logger.info('✅ Overdue checker started (runs every 15 minutes)');
  }

  /**
   * Stop the background overdue checker
   */
  static stopOverdueChecker(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Overdue checker stopped');
    }
  }
}

// 
