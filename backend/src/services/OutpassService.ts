import { Outpass, User } from '../models';
import { IOutpass, OutpassStatus, UserRole } from '../types';
import { QRService } from './QRService';
import { PDFService } from './PDFService';
import { EmailService } from './EmailService';
import { NotificationService } from './NotificationService';
import { getSocketService } from './SocketService';
import { SocketEvents } from '../types';
import { logger } from '../utils/logger';

export class OutpassService {
  static async createOutpass(
    studentId: string,
    data: {
      reason: string;
      destination: string;
      fromDate: Date;
      toDate: Date;
      purpose: string;
      emergencyContact: string;
    }
  ): Promise<IOutpass> {
    try {
      // Validate dates
      if (new Date(data.fromDate) < new Date()) {
        throw new Error('From date cannot be in the past');
      }

      if (new Date(data.toDate) <= new Date(data.fromDate)) {
        throw new Error('To date must be after from date');
      }

      // Check for pending outpass limit (max 3)
      const pendingCount = await Outpass.countDocuments({
        student: studentId,
        status: OutpassStatus.PENDING,
      });

      if (pendingCount >= 3) {
        throw new Error('You have reached the maximum limit of 3 pending outpasses. Please wait for approval or cancel existing ones.');
      }

      // Check for overlapping outpasses (approved or checked out)
      const overlappingOutpass = await Outpass.findOne({
        student: studentId,
        status: { $in: [OutpassStatus.APPROVED, OutpassStatus.CHECKED_OUT] },
        $or: [
          // New outpass starts during existing outpass
          {
            fromDate: { $lte: data.toDate },
            toDate: { $gte: data.fromDate },
          },
        ],
      });

      if (overlappingOutpass) {
        throw new Error('You already have an approved or active outpass during this period. Please choose different dates.');
      }

      // Create outpass
      const outpass = await Outpass.create({
        student: studentId,
        ...data,
        status: OutpassStatus.PENDING,
      });

      // Get student details
      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Find warden for the student's hostel
      const warden = await User.findOne({
        role: UserRole.WARDEN,
        hostel: student.hostel,
        isActive: true, // Only notify active wardens
      });

      if (warden) {
        // Notify warden
        await NotificationService.notifyOutpassCreated(
          warden._id.toString(),
          student.name,
          outpass._id.toString()
        );

        // Emit socket event
        try {
          const socketService = getSocketService();
          socketService.emitToUser(warden._id.toString(), SocketEvents.OUTPASS_CREATED, {
            outpass: await outpass.populate('student'),
          });
        } catch (error) {
          logger.warn('Socket service not available');
        }
      }

      // Notify student of successful creation
      await NotificationService.createNotification(
        studentId,
        '✅ Outpass Request Submitted',
        `Your outpass request for ${data.destination} has been submitted successfully and is pending warden approval.`,
        'success',
        outpass._id.toString()
      );

      // Send confirmation email to student
      try {
        await EmailService.sendOutpassCreationConfirmation(
          student.email,
          student.name,
          outpass.toJSON() as any
        );
      } catch (emailError) {
        logger.warn(`Failed to send creation confirmation email: ${emailError}`);
      }

      logger.info(`Outpass created: ${outpass._id} by student ${studentId}`);
      return (await outpass.populate('student')).toJSON() as unknown as IOutpass;
    } catch (error) {
      logger.error('Failed to create outpass:', error);
      throw error;
    }
  }

  static async getOutpassById(outpassId: string): Promise<IOutpass | null> {
    const outpass = await Outpass.findById(outpassId)
      .populate('student')
      .populate('warden')
      .populate('securityCheckOut')
      .populate('securityCheckIn')
      .lean();

    return outpass as IOutpass | null;
  }

  static async getStudentOutpasses(
    studentId: string,
    filters?: {
      status?: OutpassStatus;
      purpose?: string;
      search?: string;
      dateRange?: string;
      fromDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ outpasses: IOutpass[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = { student: studentId };
    
    // Status filter
    if (filters?.status) {
      query.status = filters.status;
    }

    // Purpose filter
    if (filters?.purpose) {
      query.purpose = filters.purpose;
    }

    // Search filter (destination or reason)
    if (filters?.search) {
      query.$or = [
        { destination: { $regex: filters.search, $options: 'i' } },
        { reason: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Date range filter
    if (filters?.dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
        case 'last1month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
        case 'last3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
        case 'custom':
          if (filters.fromDate && filters.toDate) {
            query.createdAt = {
              $gte: new Date(filters.fromDate),
              $lte: new Date(filters.toDate),
            };
          }
          break;
      }
    }

    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('warden')
        .lean(),
      Outpass.countDocuments(query),
    ]);

    return {
      outpasses: outpasses as unknown as IOutpass[],
      total,
    };
  }

  static async getWardenOutpasses(
    wardenId: string,
    filters?: {
      status?: OutpassStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ outpasses: IOutpass[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Get warden's hostel
    const warden = await User.findById(wardenId);
    if (!warden) {
      throw new Error('Warden not found');
    }

    // Find all students in the same hostel
    const students = await User.find({
      role: UserRole.STUDENT,
      hostel: warden.hostel,
    }).select('_id');

    const studentIds = students.map((s) => s._id);

    const query: any = { student: { $in: studentIds } };
    if (filters?.status) {
      query.status = filters.status;
    }

    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('student')
        .lean(),
      Outpass.countDocuments(query),
    ]);

    return {
      outpasses: outpasses as unknown as IOutpass[],
      total,
    };
  }

  static async approveOutpass(
    outpassId: string,
    wardenId: string,
    remarks?: string
  ): Promise<IOutpass> {
    try {
      const outpass = await Outpass.findById(outpassId).populate('student');
      if (!outpass) {
        throw new Error('Outpass not found');
      }

      if (outpass.status !== OutpassStatus.PENDING) {
        throw new Error('Only pending outpasses can be approved');
      }

      // Check if outpass dates are still valid (not in the past)
      const now = new Date();
      if (new Date(outpass.toDate) < now) {
        throw new Error('Cannot approve outpass with past dates. The outpass has expired.');
      }

      // Generate QR code
      const qrCodeData = QRService.generateQRData(
        outpass._id.toString(),
        (outpass.student as any)._id.toString()
      );
      const qrCode = await QRService.generateQRCode(qrCodeData);

      // Update outpass
      outpass.status = OutpassStatus.APPROVED;
      outpass.warden = wardenId as any;
      outpass.wardenRemarks = remarks;
      outpass.approvedAt = new Date();
      outpass.qrCode = qrCode;
      outpass.qrCodeData = qrCodeData;
      await outpass.save();

      const student = outpass.student as any;

      // Generate PDF
      const pdfBuffer = await PDFService.generateOutpassPDF(
        outpass.toJSON() as unknown as IOutpass,
        student.toJSON(),
        qrCode
      );

      // Send email with PDF (non-blocking)
      try {
        await EmailService.sendOutpassApprovalEmail(
          student.email,
          student.name,
          outpass.toJSON(),
          pdfBuffer
        );
      } catch (emailError) {
        logger.warn(`Failed to send approval email: ${emailError}`);
        // Continue even if email fails
      }

      // Notify student
      try {
        await NotificationService.notifyOutpassApproved(
          student._id.toString(),
          outpass._id.toString()
        );
      } catch (notifError) {
        logger.warn(`Failed to create notification: ${notifError}`);
      }

      // Emit socket event
      try {
        const socketService = getSocketService();
        socketService.emitToUser(
          student._id.toString(),
          SocketEvents.OUTPASS_APPROVED,
          { outpass: outpass.toJSON() }
        );
      } catch (error) {
        logger.warn('Socket service not available');
      }

      logger.info(`Outpass approved: ${outpassId} by warden ${wardenId}`);
      return outpass.toJSON() as unknown as IOutpass;
    } catch (error) {
      logger.error('Failed to approve outpass:', error);
      throw error;
    }
  }

  static async rejectOutpass(
    outpassId: string,
    wardenId: string,
    reason: string
  ): Promise<IOutpass> {
    try {
      // Validate rejection reason (moved from controller)
      if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
        throw new Error('Rejection reason is required and must be at least 5 characters');
      }

      const outpass = await Outpass.findById(outpassId).populate('student');
      if (!outpass) {
        throw new Error('Outpass not found');
      }

      if (outpass.status !== OutpassStatus.PENDING) {
        throw new Error('Only pending outpasses can be rejected');
      }

      // Update outpass
      outpass.status = OutpassStatus.REJECTED;
      outpass.warden = wardenId as any;
      outpass.rejectedAt = new Date();
      outpass.rejectionReason = reason;
      await outpass.save();

      const student = outpass.student as any;

      // Send rejection email
      await EmailService.sendOutpassRejectionEmail(
        student.email,
        student.name,
        outpass.toJSON(),
        reason
      );

      // Notify student
      await NotificationService.notifyOutpassRejected(
        student._id.toString(),
        reason,
        outpass._id.toString()
      );

      // Emit socket event
      try {
        const socketService = getSocketService();
        socketService.emitToUser(
          student._id.toString(),
          SocketEvents.OUTPASS_REJECTED,
          { outpass: outpass.toJSON() }
        );
      } catch (error) {
        logger.warn('Socket service not available');
      }

      logger.info(`Outpass rejected: ${outpassId} by warden ${wardenId}`);
      return outpass.toJSON() as unknown as IOutpass;
    } catch (error) {
      logger.error('Failed to reject outpass:', error);
      throw error;
    }
  }

  static async checkOut(
    outpassId: string,
    securityId: string,
    qrCodeData: string
  ): Promise<IOutpass> {
    try {
      const outpass = await Outpass.findById(outpassId).populate('student');
      if (!outpass) {
        throw new Error('Outpass not found');
      }

      if (outpass.status !== OutpassStatus.APPROVED) {
        throw new Error('Only approved outpasses can be checked out');
      }

      // Verify QR code
      const isValid = QRService.verifyQRData(
        qrCodeData,
        outpass._id.toString(),
        (outpass.student as any)._id.toString()
      );

      if (!isValid) {
        throw new Error('Invalid QR code');
      }

      // Check if outpass is still valid
      if (new Date() > new Date(outpass.toDate)) {
        throw new Error('Outpass has expired');
      }

      // Update outpass
      outpass.status = OutpassStatus.CHECKED_OUT;
      outpass.checkOutTime = new Date();
      outpass.securityCheckOut = securityId as any;
      await outpass.save();

      const student = outpass.student as any;

      // Notify student
      await NotificationService.notifyCheckOut(
        student._id.toString(),
        outpass._id.toString()
      );

      // Emit socket event
      try {
        const socketService = getSocketService();
        socketService.emitToUser(
          student._id.toString(),
          SocketEvents.OUTPASS_CHECKED_OUT,
          { outpass: outpass.toJSON() }
        );
      } catch (error) {
        logger.warn('Socket service not available');
      }

      logger.info(`Student checked out: ${outpassId} by security ${securityId}`);
      return outpass.toJSON() as unknown as IOutpass;
    } catch (error) {
      logger.error('Failed to check out:', error);
      throw error;
    }
  }

  static async checkIn(outpassId: string, securityId: string): Promise<IOutpass> {
    try {
      const outpass = await Outpass.findById(outpassId).populate('student');
      if (!outpass) {
        throw new Error('Outpass not found');
      }

      if (outpass.status !== OutpassStatus.CHECKED_OUT) {
        throw new Error('Only checked-out outpasses can be checked in');
      }

      // Update outpass
      outpass.status = OutpassStatus.CHECKED_IN;
      outpass.checkInTime = new Date();
      outpass.securityCheckIn = securityId as any;
      outpass.isOverdue = new Date() > new Date(outpass.toDate);
      await outpass.save();

      const student = outpass.student as any;

      // Notify student
      await NotificationService.notifyCheckIn(
        student._id.toString(),
        outpass._id.toString()
      );

      // Emit socket event
      try {
        const socketService = getSocketService();
        socketService.emitToUser(
          student._id.toString(),
          SocketEvents.OUTPASS_CHECKED_IN,
          { outpass: outpass.toJSON() }
        );
      } catch (error) {
        logger.warn('Socket service not available');
      }

      logger.info(`Student checked in: ${outpassId} by security ${securityId}`);
      return outpass.toJSON() as unknown as IOutpass;
    } catch (error) {
      logger.error('Failed to check in:', error);
      throw error;
    }
  }

  static async getActiveOutpasses(): Promise<IOutpass[]> {
    const outpasses = await Outpass.find({
      status: OutpassStatus.CHECKED_OUT,
    })
      .populate('student')
      .sort({ checkOutTime: -1 })
      .lean();

    return outpasses as unknown as IOutpass[];
  }

  static async getOverdueOutpasses(): Promise<IOutpass[]> {
    const now = new Date();
    const outpasses = await Outpass.find({
      status: OutpassStatus.CHECKED_OUT,
      toDate: { $lt: now },
    })
      .populate('student')
      .lean();

    return outpasses as unknown as IOutpass[];
  }

  static async cancelOutpass(outpassId: string, studentId: string): Promise<IOutpass> {
    const outpass = await Outpass.findOne({
      _id: outpassId,
      student: studentId,
    });

    if (!outpass) {
      throw new Error('Outpass not found');
    }

    if (outpass.status !== OutpassStatus.PENDING) {
      throw new Error('Only pending outpasses can be cancelled');
    }

    outpass.status = OutpassStatus.CANCELLED;
    await outpass.save();

    logger.info(`Outpass cancelled: ${outpassId} by student ${studentId}`);
    return outpass.toJSON() as unknown as IOutpass;
  }

  static async getDashboardStats(userId: string, role: UserRole): Promise<any> {
    let query: any = {};

    if (role === UserRole.STUDENT) {
      query.student = userId;
    } else if (role === UserRole.WARDEN) {
      const warden = await User.findById(userId);
      if (warden) {
        const students = await User.find({
          role: UserRole.STUDENT,
          hostel: warden.hostel,
        }).select('_id');
        query.student = { $in: students.map((s) => s._id) };
      }
    }

    const [total, pending, approved, rejected, checkedOut, overdue] = await Promise.all([
      Outpass.countDocuments(query),
      Outpass.countDocuments({ ...query, status: OutpassStatus.PENDING }),
      Outpass.countDocuments({ ...query, status: OutpassStatus.APPROVED }),
      Outpass.countDocuments({ ...query, status: OutpassStatus.REJECTED }),
      Outpass.countDocuments({ ...query, status: OutpassStatus.CHECKED_OUT }),
      Outpass.countDocuments({
        ...query,
        status: OutpassStatus.CHECKED_OUT,
        toDate: { $lt: new Date() },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      checkedOut,
      overdue,
    };
  }

  /**
   * Verify QR code for an outpass (moved from controller)
   */
  static async verifyQRCode(
    outpassId: string,
    qrCodeData: string
  ): Promise<{ valid: boolean; outpass: IOutpass | null }> {
    // Validate inputs
    if (!outpassId || !qrCodeData) {
      throw new Error('Outpass ID and QR code data are required');
    }

    const outpass = await this.getOutpassById(outpassId);

    if (!outpass) {
      throw new Error('Outpass not found');
    }

    // Extract student ID
    const studentId = typeof outpass.student === 'string'
      ? outpass.student
      : (outpass.student as any)._id?.toString();

    const isValid = QRService.verifyQRData(qrCodeData, outpassId, studentId);

    return {
      valid: isValid,
      outpass: isValid ? outpass : null,
    };
  }
}

// 
