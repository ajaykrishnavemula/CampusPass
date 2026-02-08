import { User, SystemSettings } from '../models';
import { logger } from '../utils/logger';

export class StudentService {
  /**
   * Validate student can create outpass
   * Checks system status, user permissions, overdue count, and duration
   */
  static async validateOutpassCreation(
    studentId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{ valid: boolean; error?: string; statusCode?: number }> {
    // Fetch settings and user in parallel to reduce database calls
    const [settings, user] = await Promise.all([
      SystemSettings.findOne(),
      User.findById(studentId),
    ]);

    // 1. Check user exists
    if (!user) {
      return {
        valid: false,
        error: 'User not found',
        statusCode: 404,
      };
    }

    // 2. Check if system is active
    if (!settings || settings.systemStatus !== 'active') {
      return {
        valid: false,
        error: 'System is currently inactive. Outpass creation is disabled by admin.',
        statusCode: 403,
      };
    }

    // 3. Check user permissions

    if (!user.canCreateOutpass) {
      return {
        valid: false,
        error: 'You are not allowed to create outpasses. Please contact admin.',
        statusCode: 403,
      };
    }

    // 3. Check overdue count
    if (user.overdueCount >= 3) {
      return {
        valid: false,
        error: 'You have exceeded the maximum overdue limit (3). Please contact admin to reset.',
        statusCode: 403,
      };
    }

    // 4. Validate duration against settings
    const duration = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

    if (duration > settings.maxOutpassDuration) {
      return {
        valid: false,
        error: `Outpass duration cannot exceed ${settings.maxOutpassDuration} days.`,
        statusCode: 400,
      };
    }

    logger.info(`Outpass validation passed for student: ${studentId}`);
    return { valid: true };
  }

  /**
   * Verify that an outpass belongs to a specific student
   */
  static verifyOutpassOwnership(outpass: any, studentId: string): boolean {
    const outpassStudentId = outpass.student?._id?.toString() || outpass.student?.toString();
    return outpassStudentId === studentId;
  }

  /**
   * Get outpass PDF for download
   */
  static async downloadOutpassPDF(outpassId: string, studentId: string): Promise<Buffer> {
    const { Outpass } = await import('../models');
    const { PDFService } = await import('./PDFService');
    
    // Get outpass with student details
    const outpass = await Outpass.findById(outpassId).populate('student');
    
    if (!outpass) {
      throw new Error('Outpass not found');
    }
    
    // Verify ownership
    if (!this.verifyOutpassOwnership(outpass, studentId)) {
      throw new Error('Access denied');
    }
    
    // Only approved outpasses have PDFs
    if (outpass.status !== 'approved' && outpass.status !== 'checked_out' && outpass.status !== 'checked_in') {
      throw new Error('PDF is only available for approved outpasses');
    }
    
    // Check if QR code exists
    if (!outpass.qrCode) {
      throw new Error('QR code not generated yet');
    }
    
    const student = outpass.student as any;
    
    // Generate PDF
    const pdfBuffer = await PDFService.generateOutpassPDF(
      outpass.toJSON() as any,
      student.toJSON(),
      outpass.qrCode
    );
    
    return pdfBuffer;
  }

  /**
   * Get latest outpass for student
   */
  static async getLatestOutpass(studentId: string): Promise<any | null> {
    const { Outpass } = await import('../models');
    
    const latestOutpass = await Outpass.findOne({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate('student', 'name rollNumber hostel');
    
    return latestOutpass;
  }

  /**
   * Get analytics data for student dashboard
   */
  static async getAnalytics(studentId: string): Promise<{
    approved: number;
    pending: number;
    rejected: number;
    overdue: number;
  }> {
    const { Outpass } = await import('../models');
    
    // Count all outpasses by status
    // Note: 'approved', 'checked_out', and 'checked_in' are all considered "approved" for analytics
    const [approved, checkedOut, checkedIn, pending, rejected, overdue] = await Promise.all([
      Outpass.countDocuments({ student: studentId, status: 'approved' }),
      Outpass.countDocuments({ student: studentId, status: 'checked_out' }),
      Outpass.countDocuments({ student: studentId, status: 'checked_in' }),
      Outpass.countDocuments({ student: studentId, status: 'pending' }),
      Outpass.countDocuments({ student: studentId, status: 'rejected' }),
      Outpass.countDocuments({ student: studentId, isOverdue: true }),
    ]);
    
    // Combine approved, checked_out, and checked_in into "approved" count
    return {
      approved: approved + checkedOut + checkedIn,
      pending,
      rejected,
      overdue
    };
  }
}

// 