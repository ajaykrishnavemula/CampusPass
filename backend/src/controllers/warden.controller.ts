import { FastifyRequest, FastifyReply } from 'fastify';
import { OutpassService, WardenService } from '../services';
import { ApproveOutpassBody, RejectOutpassBody, OutpassFilters, AuthRequest } from '../types';
import { logger } from '../utils/logger';

export class WardenController {
  static async getPendingRequests(
    request: FastifyRequest<{ Querystring: OutpassFilters }>,
    reply: FastifyReply
  ) {
    try {
      const wardenId = (request as AuthRequest).user!.id;
      const { page, limit } = request.query;

      const result = await OutpassService.getWardenOutpasses(wardenId, {
        status: 'pending' as any,
        page: page ? parseInt(page.toString()) : 1,
        limit: limit ? parseInt(limit.toString()) : 10,
      });

      return reply.send({
        success: true,
        data: {
          outpasses: result.outpasses,
          pagination: {
            page: page || 1,
            limit: limit || 10,
            total: result.total,
            pages: Math.ceil(result.total / (limit || 10)),
          },
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch pending requests',
      });
    }
  }

  static async getAllOutpasses(
    request: FastifyRequest<{
      Querystring: {
        status?: string;
        dateRange?: string;
        search?: string;
        page?: string;
        limit?: string;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const wardenId = (request as AuthRequest).user!.id;
      const { status, dateRange, search, page = '1', limit = '20' } = request.query;

      const result = await WardenService.getAllOutpasses(wardenId, {
        status,
        dateRange,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get hostel outpasses error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch outpasses',
      });
    }
  }

  static async getOutpassById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const wardenId = (request as AuthRequest).user!.id;

      // Verify warden has access to this outpass
      const hasAccess = await WardenService.verifyWardenAccess(wardenId, id);
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          message: 'Access denied. This outpass does not belong to your hostel.',
        });
      }

      const outpass = await OutpassService.getOutpassById(id);

      if (!outpass) {
        return reply.status(404).send({
          success: false,
          message: 'Outpass not found',
        });
      }

      return reply.send({
        success: true,
        data: outpass,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch outpass',
      });
    }
  }

  static async approveOutpass(
    request: FastifyRequest<{
      Params: { id: string };
      Body: ApproveOutpassBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const wardenId = (request as AuthRequest).user!.id;
      const { remarks } = request.body;

      const outpass = await OutpassService.approveOutpass(id, wardenId, remarks);

      return reply.send({
        success: true,
        message: 'Outpass approved successfully',
        data: { outpass },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to approve outpass',
      });
    }
  }

  static async rejectOutpass(
    request: FastifyRequest<{
      Params: { id: string };
      Body: RejectOutpassBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const wardenId = (request as AuthRequest).user!.id;
      const { reason } = request.body;

      // Validation moved to service
      const outpass = await OutpassService.rejectOutpass(id, wardenId, reason);

      return reply.send({
        success: true,
        message: 'Outpass rejected successfully',
        data: { outpass },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to reject outpass',
      });
    }
  }

  static async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const wardenId = (request as AuthRequest).user!.id;

      const dashboardData = await WardenService.getDashboardStats(wardenId);

      return reply.send({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      logger.error('Get warden dashboard error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch dashboard data',
      });
    }
  }

  static async getOverdueOutpasses(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const outpasses = await OutpassService.getOverdueOutpasses();

      return reply.send({
        success: true,
        data: { outpasses },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch overdue outpasses',
      });
    }
  }

  /**
   * Get hostel information
   */
  static async getHostelInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const wardenId = (request as AuthRequest).user!.id;
      const hostelInfo = await WardenService.getHostelInfo(wardenId);

      return reply.send({
        success: true,
        data: hostelInfo,
      });
    } catch (error: any) {
      logger.error('Get hostel info error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch hostel information',
      });
    }
  }

  /**
   * Get statistics for dashboard
   */
  static async getStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const wardenId = (request as AuthRequest).user!.id;
      const statistics = await WardenService.getStatistics(wardenId);

      return reply.send({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      logger.error('Get statistics error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch statistics',
      });
    }
  }

  /**
   * Get analytics data
   */
  static async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const wardenId = (request as AuthRequest).user!.id;
      const analytics = await WardenService.getAnalytics(wardenId);

      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      logger.error('Get analytics error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch analytics',
      });
    }
  }

  /**
   * Get outpasses with enhanced filtering
   */
  static async getOutpassesEnhanced(
    request: FastifyRequest<{
      Querystring: {
        status?: string;
        purpose?: string;
        search?: string;
        dateRange?: string;
        fromDate?: string;
        toDate?: string;
        overdueOnly?: string;
        page?: string;
        limit?: string;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const wardenId = (request as AuthRequest).user!.id;
      const {
        status,
        purpose,
        search,
        dateRange,
        fromDate,
        toDate,
        overdueOnly,
        page = '1',
        limit = '20',
      } = request.query;

      const result = await WardenService.getOutpassesEnhanced(wardenId, {
        status,
        purpose,
        search,
        dateRange,
        fromDate,
        toDate,
        overdueOnly: overdueOnly === 'true',
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get enhanced outpasses error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch outpasses',
      });
    }
  }

  /**
   * Approve outpass with optional note (new endpoint)
   */
  static async approveOutpassNew(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { note?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const wardenId = (request as AuthRequest).user!.id;
      const { note } = request.body;

      const outpass = await WardenService.approveOutpass(wardenId, id, note);

      return reply.send({
        success: true,
        message: 'Outpass approved successfully',
        data: { outpass },
      });
    } catch (error: any) {
      logger.error('Approve outpass error:', error);
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to approve outpass',
      });
    }
  }

  /**
   * Reject outpass with mandatory reason (new endpoint)
   */
  static async rejectOutpassNew(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { reason: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const wardenId = (request as AuthRequest).user!.id;
      const { reason } = request.body;

      const outpass = await WardenService.rejectOutpass(wardenId, id, reason);

      return reply.send({
        success: true,
        message: 'Outpass rejected successfully',
        data: { outpass },
      });
    } catch (error: any) {
      logger.error('Reject outpass error:', error);
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to reject outpass',
      });
    }
  }
}

// 
