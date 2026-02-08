import { Outpass, SecurityLog } from '../models';
import { OutpassStatus, SocketEvents } from '../types';
import mongoose from 'mongoose';
import { getSocketService } from './SocketService';
import { logger } from '../utils/logger';

interface QRValidationResult {
  valid: boolean;
  state: 'VALID_CHECK_OUT' | 'VALID_CHECK_IN' | 'WARNING_OVERDUE' | 'INVALID';
  message: string;
  outpass?: any;
  canCheckOut?: boolean;
  canCheckIn?: boolean;
  isOverdue?: boolean;
  overdueMinutes?: number;
}

interface HistoryFilters {
  startDate?: Date;
  endDate?: Date;
  hostel?: string;
  studentName?: string;
  rollNumber?: string;
  action?: 'check_out' | 'check_in' | 'invalid_scan';
  result?: 'success' | 'failed' | 'overdue';
  page?: number;
  limit?: number;
}

export class SecurityService {
  /**
   * Get enhanced dashboard statistics for security
   * Returns 4 tiles: Active Outside, Checked-in Today, Invalid Scans, Overdue
   */
  static async getStatistics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      activeOutside,
      checkedInToday,
      invalidScansToday,
      overdueCount,
    ] = await Promise.all([
      // Active Outside: Currently checked out
      Outpass.countDocuments({
        status: OutpassStatus.CHECKED_OUT,
        checkOutTime: { $ne: null },
        $or: [
          { checkInTime: { $exists: false } },
          { checkInTime: null }
        ]
      }),
      
      // Checked-in Today: Check-ins completed today
      Outpass.countDocuments({
        checkInTime: { $gte: todayStart }
      }),
      
      // Invalid Scans Today: Failed scan attempts today
      SecurityLog.countDocuments({
        action: 'invalid_scan',
        timestamp: { $gte: todayStart }
      }),
      
      // Overdue: Currently checked out and past expected return
      Outpass.countDocuments({
        status: OutpassStatus.CHECKED_OUT,
        checkOutTime: { $ne: null },
        $or: [
          { checkInTime: { $exists: false } },
          { checkInTime: null }
        ],
        toDate: { $lt: now }
      })
    ]);

    return {
      activeOutside,
      checkedInToday,
      invalidScansToday,
      overdueCount,
    };
  }

  /**
   * Comprehensive QR validation with 4 states
   * Accepts both QR codes and Outpass IDs
   * Returns validation result with appropriate state and actions
   */
  static async validateQR(qrCodeOrId: string): Promise<QRValidationResult> {
    try {
      // Try to find outpass by QR code first, then by ID
      let outpass = await Outpass.findOne({ qrCode: qrCodeOrId })
        .populate('student', 'name rollNumber phone hostel')
        .lean();

      // If not found by QR code, try finding by Outpass ID
      if (!outpass && mongoose.Types.ObjectId.isValid(qrCodeOrId)) {
        outpass = await Outpass.findById(qrCodeOrId)
          .populate('student', 'name rollNumber phone hostel')
          .lean();
      }

      if (!outpass) {
        return {
          valid: false,
          state: 'INVALID',
          message: 'QR code or Outpass ID not found in system',
        };
      }

      // Check if outpass is approved
      if (outpass.status !== OutpassStatus.APPROVED && outpass.status !== OutpassStatus.CHECKED_OUT) {
        return {
          valid: false,
          state: 'INVALID',
          message: `Outpass is ${outpass.status.toLowerCase()}. Only approved outpasses can be used.`,
        };
      }

      // Check QR code expiry
      if (outpass.qrCodeExpiry && new Date(outpass.qrCodeExpiry) < new Date()) {
        return {
          valid: false,
          state: 'INVALID',
          message: 'QR code has expired',
        };
      }

      const now = new Date();
      const expectedReturn = new Date(outpass.toDate);

      // STATE 1: VALID - CHECK-OUT ALLOWED
      // Outpass is approved, not yet checked out
      if (outpass.status === OutpassStatus.APPROVED && !outpass.checkOutTime) {
        return {
          valid: true,
          state: 'VALID_CHECK_OUT',
          message: 'Student can check out',
          outpass,
          canCheckOut: true,
          canCheckIn: false,
          isOverdue: false,
        };
      }

      // STATE 2: VALID - CHECK-IN ALLOWED (Not Overdue)
      // Student is checked out, within expected return time
      if (outpass.status === OutpassStatus.CHECKED_OUT && outpass.checkOutTime && !outpass.checkInTime) {
        if (now <= expectedReturn) {
          return {
            valid: true,
            state: 'VALID_CHECK_IN',
            message: 'Student can check in (on time)',
            outpass,
            canCheckOut: false,
            canCheckIn: true,
            isOverdue: false,
          };
        }

        // STATE 3: WARNING - OVERDUE CHECK-IN
        // Student is checked out but past expected return time
        const overdueMinutes = Math.floor((now.getTime() - expectedReturn.getTime()) / (1000 * 60));
        return {
          valid: true,
          state: 'WARNING_OVERDUE',
          message: `Student is overdue by ${overdueMinutes} minutes`,
          outpass,
          canCheckOut: false,
          canCheckIn: true,
          isOverdue: true,
          overdueMinutes,
        };
      }

      // STATE 4: INVALID - Already checked in
      if (outpass.checkInTime) {
        return {
          valid: false,
          state: 'INVALID',
          message: 'Student has already checked in',
        };
      }

      // Default invalid state
      return {
        valid: false,
        state: 'INVALID',
        message: 'Invalid outpass state',
      };
    } catch (error) {
      console.error('QR Validation Error:', error);
      return {
        valid: false,
        state: 'INVALID',
        message: 'Error validating QR code',
      };
    }
  }

  /**
   * Check out a student
   * Marks outpass as checked out and creates audit log
   */
  static async checkOut(outpassId: string, securityId: string) {
    try {
      const outpass = await Outpass.findById(outpassId)
        .populate('student', 'name rollNumber hostel');

      if (!outpass) {
        throw new Error('Outpass not found');
      }

      if (outpass.status !== OutpassStatus.APPROVED) {
        throw new Error('Only approved outpasses can be checked out');
      }

      if (outpass.checkOutTime) {
        throw new Error('Student has already checked out');
      }

      // Update outpass
      outpass.status = OutpassStatus.CHECKED_OUT;
      outpass.checkOutTime = new Date();
      outpass.securityCheckOut = securityId as any;
      await outpass.save();

      // Create security log
      await SecurityLog.create({
        outpass: outpass._id,
        student: outpass.student,
        security: securityId,
        action: 'check_out',
        timestamp: new Date(),
        result: 'success',
        qrCode: outpass.qrCode,
        metadata: {
          hostel: (outpass.student as any).hostel,
          destination: outpass.destination,
          expectedReturn: outpass.toDate,
        },
      });

      // Emit socket events for real-time updates
      try {
        const socketService = getSocketService();
        
        // Broadcast statistics update to all security personnel
        const stats = await this.getStatistics();
        socketService.emitToAll(SocketEvents.SECURITY_STATISTICS_UPDATE, stats);
        
        // Broadcast active outpasses update
        const activeOutpasses = await this.getActiveOutpasses();
        socketService.emitToAll(SocketEvents.SECURITY_ACTIVE_OUTPASSES_UPDATE, activeOutpasses);
      } catch (error) {
        logger.warn('Socket service not available for real-time updates');
      }

      return {
        success: true,
        message: 'Student checked out successfully',
        outpass,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check in a student
   * Marks outpass as checked in, handles overdue cases, creates audit log
   */
  static async checkIn(outpassId: string, securityId: string) {
    try {
      const outpass = await Outpass.findById(outpassId)
        .populate('student', 'name rollNumber hostel');

      if (!outpass) {
        throw new Error('Outpass not found');
      }

      if (outpass.status !== OutpassStatus.CHECKED_OUT) {
        throw new Error('Student has not checked out yet');
      }

      if (outpass.checkInTime) {
        throw new Error('Student has already checked in');
      }

      const now = new Date();
      const expectedReturn = new Date(outpass.toDate);
      const isOverdue = now > expectedReturn;
      const overdueMinutes = isOverdue
        ? Math.floor((now.getTime() - expectedReturn.getTime()) / (1000 * 60))
        : 0;

      // Update outpass
      outpass.checkInTime = now;
      outpass.securityCheckIn = securityId as any;
      outpass.isOverdue = isOverdue;
      
      // If checked in, mark as completed
      outpass.status = OutpassStatus.APPROVED; // Keep as approved but with check-in time
      
      await outpass.save();

      // Create security log
      await SecurityLog.create({
        outpass: outpass._id,
        student: outpass.student,
        security: securityId,
        action: 'check_in',
        timestamp: now,
        result: isOverdue ? 'overdue' : 'success',
        qrCode: outpass.qrCode,
        metadata: {
          hostel: (outpass.student as any).hostel,
          destination: outpass.destination,
          expectedReturn: outpass.toDate,
          actualReturn: now,
          overdueMinutes: isOverdue ? overdueMinutes : undefined,
        },
      });

      // Emit socket events for real-time updates
      try {
        const socketService = getSocketService();
        
        // Broadcast statistics update to all security personnel
        const stats = await this.getStatistics();
        socketService.emitToAll(SocketEvents.SECURITY_STATISTICS_UPDATE, stats);
        
        // Broadcast active outpasses update
        const activeOutpasses = await this.getActiveOutpasses();
        socketService.emitToAll(SocketEvents.SECURITY_ACTIVE_OUTPASSES_UPDATE, activeOutpasses);
      } catch (error) {
        logger.warn('Socket service not available for real-time updates');
      }

      return {
        success: true,
        message: isOverdue
          ? `Student checked in (overdue by ${overdueMinutes} minutes)`
          : 'Student checked in successfully',
        outpass,
        isOverdue,
        overdueMinutes,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get currently checked-out students (active outpasses)
   */
  static async getActiveOutpasses() {
    const now = new Date();
    
    const outpasses = await Outpass.find({
      status: OutpassStatus.CHECKED_OUT,
      checkOutTime: { $ne: null },
      $or: [
        { checkInTime: { $exists: false } },
        { checkInTime: null }
      ]
    })
      .populate('student', 'name rollNumber phone hostel')
      .populate('securityCheckOut', 'name')
      .sort({ checkOutTime: -1 })
      .lean();

    // Add overdue status to each outpass
    const enrichedOutpasses = outpasses.map(outpass => {
      const expectedReturn = new Date(outpass.toDate);
      const isOverdue = now > expectedReturn;
      const overdueMinutes = isOverdue 
        ? Math.floor((now.getTime() - expectedReturn.getTime()) / (1000 * 60))
        : 0;
      
      // Calculate time until overdue (for near-overdue warning)
      const minutesUntilOverdue = Math.floor((expectedReturn.getTime() - now.getTime()) / (1000 * 60));
      const isNearOverdue = minutesUntilOverdue > 0 && minutesUntilOverdue <= 30;

      return {
        ...outpass,
        isOverdue,
        overdueMinutes,
        isNearOverdue,
        minutesUntilOverdue: minutesUntilOverdue > 0 ? minutesUntilOverdue : 0,
      };
    });

    return enrichedOutpasses;
  }

  /**
   * Get all outpasses visible to security with filters
   * Shows approved, checked_out, and recently checked-in outpasses
   */
  static async getAllOutpasses(filters: {
    status?: OutpassStatus | OutpassStatus[];
    hostel?: string;
    studentName?: string;
    rollNumber?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}) {
    const {
      status,
      hostel,
      studentName,
      rollNumber,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    // Build query
    const query: any = {};

    // Status filter - default to approved and checked_out
    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    } else {
      // Default: show approved (ready to check out) and checked_out (currently outside)
      query.status = { $in: [OutpassStatus.APPROVED, OutpassStatus.CHECKED_OUT] };
    }

    // Date range filter
    if (startDate || endDate) {
      query.fromDate = {};
      if (startDate) query.fromDate.$gte = startDate;
      if (endDate) query.fromDate.$lte = endDate;
    }

    // Get total count
    const total = await Outpass.countDocuments(query);

    // Fetch outpasses with pagination
    const skip = (page - 1) * limit;
    let outpasses = await Outpass.find(query)
      .populate('student', 'name rollNumber phone hostel')
      .populate('warden', 'name')
      .populate('securityCheckOut', 'name')
      .populate('securityCheckIn', 'name')
      .sort({ fromDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Apply student-based filters after population
    if (hostel || studentName || rollNumber) {
      outpasses = outpasses.filter(outpass => {
        const student = outpass.student as any;
        if (!student) return false;
        
        if (hostel && student.hostel !== hostel) return false;
        if (studentName && !student.name.toLowerCase().includes(studentName.toLowerCase())) return false;
        if (rollNumber && !student.rollNumber.toLowerCase().includes(rollNumber.toLowerCase())) return false;
        
        return true;
      });
    }

    // Enrich with overdue status
    const now = new Date();
    const enrichedOutpasses = outpasses.map(outpass => {
      const expectedReturn = new Date(outpass.toDate);
      const isOverdue = outpass.status === OutpassStatus.CHECKED_OUT &&
                        !outpass.checkInTime &&
                        now > expectedReturn;
      const overdueMinutes = isOverdue
        ? Math.floor((now.getTime() - expectedReturn.getTime()) / (1000 * 60))
        : 0;

      return {
        ...outpass,
        isOverdue,
        overdueMinutes: isOverdue ? overdueMinutes : undefined,
      };
    });

    return {
      outpasses: enrichedOutpasses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get check-in/out history with filters
   * Supports pagination and various filters
   */
  static async getHistory(filters: HistoryFilters = {}) {
    const {
      startDate,
      endDate,
      hostel,
      studentName,
      rollNumber,
      action,
      result,
      page = 1,
      limit = 50,
    } = filters;

    // Build query
    const query: any = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    if (action) {
      query.action = action;
    }

    if (result) {
      query.result = result;
    }

    // For student filters, we need to populate first then filter
    const baseQuery = SecurityLog.find(query)
      .populate('student', 'name rollNumber phone hostel')
      .populate('security', 'name')
      .populate('outpass', 'destination fromDate toDate')
      .sort({ timestamp: -1 });

    // Get total count for pagination
    const total = await SecurityLog.countDocuments(query);

    // Apply pagination
    const skip = (page - 1) * limit;
    let logs = await baseQuery.skip(skip).limit(limit).lean();

    // Apply student-based filters after population
    if (hostel || studentName || rollNumber) {
      logs = logs.filter(log => {
        const student = log.student as any;
        if (!student) return false;
        
        if (hostel && student.hostel !== hostel) return false;
        if (studentName && !student.name.toLowerCase().includes(studentName.toLowerCase())) return false;
        if (rollNumber && !student.rollNumber.toLowerCase().includes(rollNumber.toLowerCase())) return false;
        
        return true;
      });
    }

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Record an invalid scan attempt
   * Used for audit trail and security monitoring
   */
  static async recordInvalidScan(
    qrCode: string,
    securityId: string,
    reason: string,
    studentId?: string,
    outpassId?: string
  ) {
    try {
      await SecurityLog.create({
        outpass: outpassId || new mongoose.Types.ObjectId(), // Dummy ID if not found
        student: studentId || new mongoose.Types.ObjectId(), // Dummy ID if not found
        security: securityId,
        action: 'invalid_scan',
        timestamp: new Date(),
        result: 'failed',
        reason,
        qrCode,
      });

      // Emit socket event for invalid scan alert
      try {
        const socketService = getSocketService();
        socketService.emitToAll(SocketEvents.SECURITY_INVALID_SCAN, {
          qrCode,
          reason,
          timestamp: new Date(),
        });
        
        // Also update statistics
        const stats = await this.getStatistics();
        socketService.emitToAll(SocketEvents.SECURITY_STATISTICS_UPDATE, stats);
      } catch (error) {
        logger.warn('Socket service not available for invalid scan alert');
      }

      return {
        success: true,
        message: 'Invalid scan recorded',
      };
    } catch (error) {
      console.error('Error recording invalid scan:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics (legacy method for backward compatibility)
   */
  static async getDashboardStats() {
    return this.getStatistics();
  }
}

// 