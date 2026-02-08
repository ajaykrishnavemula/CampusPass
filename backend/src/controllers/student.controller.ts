import { FastifyRequest, FastifyReply } from 'fastify';
import { OutpassService, StudentService } from '../services';
import { CreateOutpassBody, OutpassFilters, AuthRequest } from '../types';

export class StudentController {
  static async createOutpass(
    request: FastifyRequest<{ Body: CreateOutpassBody }>,
    reply: FastifyReply
  ) {
    try {
      const studentId = (request as AuthRequest).user!.id;
      const fromDate = new Date(request.body.fromDate);
      const toDate = new Date(request.body.toDate);

      // Validate outpass creation
      const validation = await StudentService.validateOutpassCreation(
        studentId,
        fromDate,
        toDate
      );

      if (!validation.valid) {
        return reply.status(validation.statusCode || 400).send({
          success: false,
          message: validation.error,
        });
      }

      // Create outpass
      const outpass = await OutpassService.createOutpass(studentId, {
        ...request.body,
        fromDate,
        toDate,
      });

      return reply.status(201).send({
        success: true,
        message: 'Outpass request created successfully',
        data: { outpass },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to create outpass',
      });
    }
  }

  static async getMyOutpasses(
    request: FastifyRequest<{ Querystring: OutpassFilters }>,
    reply: FastifyReply
  ) {
    try {
      const studentId = (request as AuthRequest).user!.id;
      const { status, purpose, search, dateRange, fromDate, toDate, page, limit } = request.query;

      const result = await OutpassService.getStudentOutpasses(studentId, {
        status,
        purpose,
        search,
        dateRange,
        fromDate,
        toDate,
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
      const studentId = (request as AuthRequest).user!.id;

      const outpass = await OutpassService.getOutpassById(id);

      if (!outpass) {
        return reply.status(404).send({
          success: false,
          message: 'Outpass not found',
        });
      }

      // Verify the outpass belongs to the student
      if (!StudentService.verifyOutpassOwnership(outpass, studentId)) {
        return reply.status(403).send({
          success: false,
          message: 'Access denied',
        });
      }

      return reply.send({
        success: true,
        data: { outpass },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch outpass',
      });
    }
  }

  static async cancelOutpass(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const studentId = (request as AuthRequest).user!.id;

      const outpass = await OutpassService.cancelOutpass(id, studentId);

      return reply.send({
        success: true,
        message: 'Outpass cancelled successfully',
        data: { outpass },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to cancel outpass',
      });
    }
  }

  static async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const studentId = (request as AuthRequest).user!.id;
      const role = (request as AuthRequest).user!.role;

      const stats = await OutpassService.getDashboardStats(studentId, role);

      return reply.send({
        success: true,
        data: { stats },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch dashboard stats',
      });
    }
  }

  static async downloadOutpassPDF(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const studentId = (request as AuthRequest).user!.id;

      const pdfBuffer = await StudentService.downloadOutpassPDF(id, studentId);

      // Set proper headers for PDF download
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="outpass-${id}.pdf"`);
      reply.header('Content-Length', pdfBuffer.length);

      return reply.send(pdfBuffer);
    } catch (error: any) {
      return reply.status(error.message === 'Outpass not found' ? 404 :
                         error.message === 'Access denied' ? 403 : 400).send({
        success: false,
        message: error.message || 'Failed to download PDF',
      });
    }
  }

  static async getLatestOutpass(request: FastifyRequest, reply: FastifyReply) {
    try {
      const studentId = (request as AuthRequest).user!.id;
      
      const latestOutpass = await StudentService.getLatestOutpass(studentId);
      
      return reply.send({
        success: true,
        data: { outpass: latestOutpass },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch latest outpass',
      });
    }
  }

  static async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const studentId = (request as AuthRequest).user!.id;
      
      const analytics = await StudentService.getAnalytics(studentId);
      
      return reply.send({
        success: true,
        data: { analytics },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch analytics',
      });
    }
  }
}

// 
