import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from '../services/AdminService';
import { AuthRequest, UserRole, OutpassStatus } from '../types';
import { logger } from '../utils/logger';

export class AdminController {
  /**
   * Get system-wide statistics for dashboard
   * GET /api/admin/statistics/system
   */
  static async getSystemStatistics(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await AdminService.getSystemStatistics();

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get system statistics error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch system statistics',
      });
    }
  }

  /**
   * Get user statistics by role
   * GET /api/admin/statistics/users
   */
  static async getUserStatistics(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await AdminService.getUserStatistics();

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get user statistics error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch user statistics',
      });
    }
  }

  /**
   * Get outpass statistics breakdown
   * GET /api/admin/statistics/outpasses
   */
  static async getOutpassStatistics(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await AdminService.getOutpassStatistics();

      // Transform to match frontend interface
      const transformedStats = {
        total: stats.total,
        byStatus: {
          pending: stats.pending,
          approved: stats.approved,
          rejected: stats.rejected,
          active: stats.active,
          completed: stats.checkedIn,
          cancelled: 0, // Not tracked separately
          overdue: stats.overdue,
        },
      };

      return reply.send({
        success: true,
        data: transformedStats,
      });
    } catch (error: any) {
      logger.error('Get outpass statistics error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch outpass statistics',
      });
    }
  }

  /**
   * Get hostel-wise statistics
   * GET /api/admin/statistics/hostels
   */
  static async getHostelStatistics(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await AdminService.getHostelStatistics();

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get hostel statistics error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch hostel statistics',
      });
    }
  }

  /**
   * Get critical alerts (high overdue, recent overrides)
   * GET /api/admin/alerts/critical
   */
  static async getCriticalAlerts(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const alerts = await AdminService.getCriticalAlerts();

      return reply.send({
        success: true,
        data: alerts,
      });
    } catch (error: any) {
      logger.error('Get critical alerts error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch critical alerts',
      });
    }
  }

  /**
   * Get all users with filters and pagination
   * GET /api/admin/users
   */
  static async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        search?: string;
        role?: string;
        status?: string;
        hostel?: string;
        page?: string;
        limit?: string;
      };

      const filters = {
        search: query.search,
        role: query.role ? parseInt(query.role) as UserRole : undefined,
        status: query.status as 'active' | 'inactive' | undefined,
        hostel: query.hostel,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
      };

      const result = await AdminService.getAllUsers(filters);

      return reply.send({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get all users error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch users',
      });
    }
  }

  /**
   * Create a new user
   * POST /api/admin/users
   */
  static async createUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userData = request.body as any;
      const adminId = (request as AuthRequest).user!.id;

      const user = await AdminService.createUser(userData, adminId);

      return reply.status(201).send({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error: any) {
      logger.error('Create user error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to create user',
      });
    }
  }

  /**
   * Update user details
   * PUT /api/admin/users/:id
   */
  static async updateUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updates = request.body as any;
      const adminId = (request as AuthRequest).user!.id;

      const user = await AdminService.updateUser(id, updates, adminId);

      return reply.send({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error: any) {
      logger.error('Update user error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to update user',
      });
    }
  }

  /**
   * Delete user
   * DELETE /api/admin/users/:id
   */
  static async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const adminId = (request as AuthRequest).user!.id;

      const result = await AdminService.deleteUser(id, adminId);

      return reply.send({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Delete user error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to delete user',
      });
    }
  }

  /**
   * Toggle user active status
   * PATCH /api/admin/users/:id/status
   */
  static async toggleUserStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const adminId = (request as AuthRequest).user!.id;

      const user = await AdminService.toggleUserStatus(id, adminId);

      return reply.send({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: user,
      });
    } catch (error: any) {
      logger.error('Toggle user status error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to toggle user status',
      });
    }
  }

  /**
   * Override student restriction
   * POST /api/admin/users/:id/override
   */
  static async overrideRestriction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        reason: string;
        overrideType: 'restriction_lifted' | 'overdue_reset' | 'manual_approval';
      };
      const adminId = (request as AuthRequest).user!.id;

      if (!body.reason || body.reason.trim().length < 10) {
        return reply.status(400).send({
          success: false,
          message: 'Reason is required and must be at least 10 characters',
        });
      }

      const user = await AdminService.overrideStudentRestriction(
        id,
        adminId,
        body.reason,
        body.overrideType
      );

      return reply.send({
        success: true,
        message: 'Student restriction overridden successfully',
        data: user,
      });
    } catch (error: any) {
      logger.error('Override restriction error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to override restriction',
      });
    }
  }

  /**
   * Get user by ID with full details
   * GET /api/admin/users/:id
   */
  static async getUserById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const user = await AdminService.getUserById(id);

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Get user by ID error:', error);
      return reply.status(error.statusCode || 404).send({
        success: false,
        message: error.message || 'Failed to fetch user details',
      });
    }
  }

  /**
   * Unlock user account (remove restriction and allow outpass creation)
   * POST /api/admin/users/:id/unlock
   */
  static async unlockUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const adminId = (request as AuthRequest).user!.id;

      const user = await AdminService.unlockUser(id, adminId);

      return reply.send({
        success: true,
        message: 'User unlocked successfully',
        data: user,
      });
    } catch (error: any) {
      logger.error('Unlock user error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to unlock user',
      });
    }
  }

  /**
   * Toggle outpass permission for a student
   * PATCH /api/admin/users/:id/outpass-permission
   */
  static async toggleOutpassPermission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { canCreateOutpass } = request.body as { canCreateOutpass: boolean };
      const adminId = (request as AuthRequest).user!.id;

      const user = await AdminService.toggleOutpassPermission(id, canCreateOutpass, adminId);

      return reply.send({
        success: true,
        message: `Outpass permission ${canCreateOutpass ? 'enabled' : 'disabled'} successfully`,
        data: user,
      });
    } catch (error: any) {
      logger.error('Toggle outpass permission error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to toggle outpass permission',
      });
    }
  }

  /**
   * Get system settings
   * GET /api/admin/settings
   */
  static async getSystemSettings(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await AdminService.getSystemSettings();

      // Transform to frontend expected format
      const transformedSettings = {
        systemStatus: settings.systemStatus,
        generalSettings: {
          siteName: settings.siteName,
          maxOutpassDuration: settings.maxOutpassDuration,
          defaultOutpassDuration: settings.maxOutpassDuration, // Use same value
          qrCodeExpiry: settings.qrCodeExpiry,
          overdueCheckInterval: settings.overdueCheckInterval,
        },
        policySettings: {
          overdueThreshold: settings.overdueThreshold,
          autoRestrictionEnabled: settings.autoApprovalEnabled,
          restrictionThreshold: settings.overdueThreshold,
          autoRejectionDays: settings.autoRejectionDays,
        },
        featureToggles: {
          notificationsEnabled: settings.notificationsEnabled,
          qrCodeEnabled: settings.qrEnforcementEnabled,
        },
      };

      return reply.send({
        success: true,
        data: transformedSettings,
      });
    } catch (error: any) {
      logger.error('Get system settings error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch system settings',
      });
    }
  }

  /**
   * Update system settings
   * PUT /api/admin/settings
   */
  static async updateSystemSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const adminId = (request as AuthRequest).user!.id;

      // Transform from frontend nested format to backend flat format
      const updates: any = {};
      
      if (body.systemStatus) {
        updates.systemStatus = body.systemStatus.toLowerCase(); // Convert ACTIVE/INACTIVE to active/inactive
      }
      
      if (body.generalSettings) {
        if (body.generalSettings.siteName) updates.siteName = body.generalSettings.siteName;
        if (body.generalSettings.maxOutpassDuration) updates.maxOutpassDuration = body.generalSettings.maxOutpassDuration;
        if (body.generalSettings.qrCodeExpiry) updates.qrCodeExpiry = body.generalSettings.qrCodeExpiry;
        if (body.generalSettings.overdueCheckInterval) updates.overdueCheckInterval = body.generalSettings.overdueCheckInterval;
      }
      
      if (body.policySettings) {
        if (body.policySettings.overdueThreshold !== undefined) updates.overdueThreshold = body.policySettings.overdueThreshold;
        if (body.policySettings.autoRestrictionEnabled !== undefined) updates.autoApprovalEnabled = body.policySettings.autoRestrictionEnabled;
        if (body.policySettings.autoRejectionDays !== undefined) updates.autoRejectionDays = body.policySettings.autoRejectionDays;
      }
      
      if (body.featureToggles) {
        if (body.featureToggles.notificationsEnabled !== undefined) updates.notificationsEnabled = body.featureToggles.notificationsEnabled;
        // qrCodeEnabled is immutable, don't update
      }

      const settings = await AdminService.updateSystemSettings(updates, adminId);

      // Transform response back to frontend format
      const transformedSettings = {
        systemStatus: settings.systemStatus,
        generalSettings: {
          siteName: settings.siteName,
          maxOutpassDuration: settings.maxOutpassDuration,
          defaultOutpassDuration: settings.maxOutpassDuration,
          qrCodeExpiry: settings.qrCodeExpiry,
          overdueCheckInterval: settings.overdueCheckInterval,
        },
        policySettings: {
          overdueThreshold: settings.overdueThreshold,
          autoRestrictionEnabled: settings.autoApprovalEnabled,
          restrictionThreshold: settings.overdueThreshold,
          autoRejectionDays: settings.autoRejectionDays,
        },
        featureToggles: {
          notificationsEnabled: settings.notificationsEnabled,
          qrCodeEnabled: settings.qrEnforcementEnabled,
        },
      };

      return reply.send({
        success: true,
        message: 'System settings updated successfully',
        data: transformedSettings,
      });
    } catch (error: any) {
      logger.error('Update system settings error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to update system settings',
      });
    }
  }

  /**
   * Get all outpasses (cross-hostel view)
   * GET /api/admin/outpasses
   */
  static async getAllOutpasses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        hostel?: string;
        student?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
        search?: string;
        purpose?: string;
        page?: string;
        limit?: string;
      };

      const filters = {
        hostel: query.hostel,
        student: query.student,
        status: query.status as OutpassStatus | undefined,
        fromDate: query.fromDate,
        toDate: query.toDate,
        search: query.search,
        purpose: query.purpose,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
      };

      const result = await AdminService.getAllOutpasses(filters);

      return reply.send({
        success: true,
        data: result.outpasses,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get all outpasses error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch outpasses',
      });
    }
  }
  /**
   * Get outpass by ID (admin can view any outpass)
   * GET /api/admin/outpasses/:id
   */
  static async getOutpassById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const outpass = await AdminService.getOutpassById(id);

      return reply.send({
        success: true,
        data: outpass,
      });
    } catch (error: any) {
      logger.error('Get outpass by ID error:', error);
      return reply.status(error.statusCode || 404).send({
        success: false,
        message: error.message || 'Failed to fetch outpass details',
      });
    }
  }


  /**
   * Override outpass status
   * POST /api/admin/outpasses/:id/override
   */
  static async overrideOutpassStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        status: OutpassStatus;
        reason: string;
      };
      const adminId = (request as AuthRequest).user!.id;

      if (!body.reason || body.reason.trim().length < 10) {
        return reply.status(400).send({
          success: false,
          message: 'Reason is required and must be at least 10 characters',
        });
      }

      const outpass = await AdminService.overrideOutpassStatus(
        id,
        adminId,
        body.status,
        body.reason
      );

      return reply.send({
        success: true,
        message: 'Outpass status overridden successfully',
        data: outpass,
      });
    } catch (error: any) {
      logger.error('Override outpass status error:', error);
      return reply.status(error.statusCode || 400).send({
        success: false,
        message: error.message || 'Failed to override outpass status',
      });
    }
  }

  /**
   * Get audit logs
   * GET /api/admin/audit-logs
   */
  static async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        admin?: string;
        action?: string;
        targetType?: string;
        fromDate?: string;
        toDate?: string;
        page?: string;
        limit?: string;
      };

      const filters = {
        admin: query.admin,
        action: query.action,
        targetType: query.targetType,
        fromDate: query.fromDate,
        toDate: query.toDate,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 50,
      };

      const result = await AdminService.getAuditLogs(filters);

      return reply.send({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get audit logs error:', error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Failed to fetch audit logs',
      });
    }
  }
}

// 