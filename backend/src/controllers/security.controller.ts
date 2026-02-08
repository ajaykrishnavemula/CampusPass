import { FastifyRequest, FastifyReply } from 'fastify';
import { SecurityService } from '../services';
import { AuthRequest } from '../types';

interface ValidateQRBody {
  qrCode: string;
}

interface CheckOutBody {
  outpassId: string;
}

interface CheckInBody {
  outpassId: string;
}

interface HistoryQuery {
  startDate?: string;
  endDate?: string;
  hostel?: string;
  studentName?: string;
  rollNumber?: string;
  action?: 'check_out' | 'check_in' | 'invalid_scan';
  result?: 'success' | 'failed' | 'overdue';
  page?: string;
  limit?: string;
}

interface AllOutpassesQuery {
  status?: string;
  hostel?: string;
  studentName?: string;
  rollNumber?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

export class SecurityController {
  /**
   * Get enhanced dashboard statistics
   * Returns 4 tiles: Active Outside, Checked-in Today, Invalid Scans, Overdue
   */
  static async getStatistics(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await SecurityService.getStatistics();

      return reply.send({
        success: true,
        statistics: {
          activeOutside: stats.activeOutside,
          checkedInToday: stats.checkedInToday,
          invalidScans: stats.invalidScansToday,
          overdue: stats.overdueCount,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch statistics',
      });
    }
  }

  /**
   * Validate QR code and return appropriate state
   * States: VALID_CHECK_OUT, VALID_CHECK_IN, WARNING_OVERDUE, INVALID
   */
  static async validateQR(
    request: FastifyRequest<{ Body: ValidateQRBody }>,
    reply: FastifyReply
  ) {
    try {
      const { qrCode } = request.body;
      const securityId = (request as AuthRequest).user!.id;

      if (!qrCode) {
        return reply.status(400).send({
          success: false,
          message: 'QR code is required',
        });
      }

      const validation = await SecurityService.validateQR(qrCode);

      // Record invalid scan if validation failed
      if (!validation.valid && validation.state === 'INVALID') {
        await SecurityService.recordInvalidScan(
          qrCode,
          securityId,
          validation.message
        );
      }

      return reply.send({
        success: true,
        data: validation,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to validate QR code',
      });
    }
  }

  /**
   * Check out a student
   * Marks outpass as checked out and creates audit log
   */
  static async checkOut(
    request: FastifyRequest<{ Body: CheckOutBody }>,
    reply: FastifyReply
  ) {
    try {
      const securityId = (request as AuthRequest).user!.id;
      const { outpassId } = request.body;

      if (!outpassId) {
        return reply.status(400).send({
          success: false,
          message: 'Outpass ID is required',
        });
      }

      const result = await SecurityService.checkOut(outpassId, securityId);

      return reply.send({
        success: true,
        message: result.message,
        data: { outpass: result.outpass },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to check out',
      });
    }
  }

  /**
   * Check in a student
   * Marks outpass as checked in, handles overdue cases, creates audit log
   */
  static async checkIn(
    request: FastifyRequest<{ Body: CheckInBody }>,
    reply: FastifyReply
  ) {
    try {
      const securityId = (request as AuthRequest).user!.id;
      const { outpassId } = request.body;

      if (!outpassId) {
        return reply.status(400).send({
          success: false,
          message: 'Outpass ID is required',
        });
      }

      const result = await SecurityService.checkIn(outpassId, securityId);

      return reply.send({
        success: true,
        message: result.message,
        data: {
          outpass: result.outpass,
          isOverdue: result.isOverdue,
          overdueMinutes: result.overdueMinutes,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to check in',
      });
    }
  }

  /**
   * Get currently checked-out students (active outpasses)
   * Includes overdue status and time calculations
   */
  static async getActiveOutpasses(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const outpasses = await SecurityService.getActiveOutpasses();

      return reply.send({
        success: true,
        outpasses,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch active outpasses',
      });
    }
  }

  /**
   * Get all outpasses with filters
   * Shows approved (ready to check out) and checked_out (currently outside) by default
   */
  static async getAllOutpasses(
    request: FastifyRequest<{ Querystring: AllOutpassesQuery }>,
    reply: FastifyReply
  ) {
    try {
      const {
        status,
        hostel,
        studentName,
        rollNumber,
        startDate,
        endDate,
        page,
        limit,
      } = request.query;

      const filters: any = {};

      if (status) {
        // Handle multiple statuses (comma-separated)
        filters.status = status.includes(',')
          ? status.split(',')
          : status;
      }
      if (hostel) filters.hostel = hostel;
      if (studentName) filters.studentName = studentName;
      if (rollNumber) filters.rollNumber = rollNumber;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await SecurityService.getAllOutpasses(filters);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch outpasses',
      });
    }
  }

  /**
   * Get check-in/out history with filters
   * Supports pagination and various filters
   */
  static async getHistory(
    request: FastifyRequest<{ Querystring: HistoryQuery }>,
    reply: FastifyReply
  ) {
    try {
      const {
        startDate,
        endDate,
        hostel,
        studentName,
        rollNumber,
        action,
        result,
        page,
        limit,
      } = request.query;

      const filters: any = {};

      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (hostel) filters.hostel = hostel;
      if (studentName) filters.studentName = studentName;
      if (rollNumber) filters.rollNumber = rollNumber;
      if (action) filters.action = action;
      if (result) filters.result = result;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const history = await SecurityService.getHistory(filters);

      return reply.send({
        success: true,
        data: history,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch history',
      });
    }
  }

  /**
   * Legacy dashboard endpoint (for backward compatibility)
   * Redirects to getStatistics
   */
  static async getDashboard(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await SecurityService.getDashboardStats();

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch dashboard data',
      });
    }
  }
}

// 
