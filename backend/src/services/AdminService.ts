import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Outpass } from '../models/Outpass';
import { SystemSettings } from '../models/SystemSettings';
import { AdminActionLog } from '../models/AdminActionLog';
import { StudentOverride } from '../models/StudentOverride';
import { Notification } from '../models/Notification';
import { UserRole, OutpassStatus } from '../types';

// Custom error class for admin service
class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export class AdminService {
  /**
   * Get system-wide statistics for admin dashboard
   */
  static async getSystemStatistics() {
    try {
      const [
        totalUsers,
        totalOutpasses,
        pendingOutpasses,
        approvedOutpasses,
        activeOutpasses,
        rejectedOutpasses,
        overdueOutpasses,
        systemSettings,
      ] = await Promise.all([
        User.countDocuments(),
        Outpass.countDocuments(),
        Outpass.countDocuments({ status: OutpassStatus.PENDING }),
        Outpass.countDocuments({ status: OutpassStatus.APPROVED }),
        Outpass.countDocuments({ status: OutpassStatus.CHECKED_OUT }),
        Outpass.countDocuments({ status: OutpassStatus.REJECTED }),
        Outpass.countDocuments({ isOverdue: true }),
        SystemSettings.findOne(),
      ]);

      return {
        totalUsers,
        totalOutpasses,
        pendingOutpasses,
        approvedOutpasses,
        activeOutpasses,
        rejectedOutpasses,
        overdueOutpasses,
        systemStatus: systemSettings?.systemStatus || 'active',
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch system statistics', 500);
    }
  }

  /**
   * Get user statistics by role
   */
  static async getUserStatistics() {
    try {
      const [totalUsers, students, wardens, security, admins, activeUsers, restrictedStudents] =
        await Promise.all([
          User.countDocuments(),
          User.countDocuments({ role: UserRole.STUDENT }),
          User.countDocuments({ role: UserRole.WARDEN }),
          User.countDocuments({ role: UserRole.SECURITY }),
          User.countDocuments({ role: UserRole.ADMIN }),
          User.countDocuments({ isActive: true }),
          User.countDocuments({ canCreateOutpass: false, role: UserRole.STUDENT }),
        ]);

      return {
        totalUsers,
        students,
        wardens,
        security,
        admins,
        activeUsers,
        restrictedStudents,
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch user statistics', 500);
    }
  }

  /**
   * Get outpass statistics breakdown
   */
  static async getOutpassStatistics() {
    try {
      const [total, pending, approved, rejected, active, overdue, checkedIn] = await Promise.all([
        Outpass.countDocuments(),
        Outpass.countDocuments({ status: OutpassStatus.PENDING }),
        Outpass.countDocuments({ status: OutpassStatus.APPROVED }),
        Outpass.countDocuments({ status: OutpassStatus.REJECTED }),
        Outpass.countDocuments({ status: OutpassStatus.CHECKED_OUT }),
        Outpass.countDocuments({ isOverdue: true }),
        Outpass.countDocuments({ status: OutpassStatus.CHECKED_IN }),
      ]);

      return {
        total,
        pending,
        approved,
        rejected,
        active,
        overdue,
        checkedIn,
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch outpass statistics', 500);
    }
  }

  /**
   * Get critical alerts (high overdue students, recent overrides)
   */
  static async getCriticalAlerts() {
    try {
      const settings = await SystemSettings.findOne();
      const overdueThreshold = settings?.overdueThreshold || 3;

      // Students with overdue count >= threshold
      const highOverdueStudents = await User.find({
        role: UserRole.STUDENT,
        overdueCount: { $gte: overdueThreshold },
      })
        .select('name email rollNumber overdueCount canCreateOutpass')
        .limit(10)
        .lean();

      // Recent overrides (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentOverrides = await StudentOverride.find({
        timestamp: { $gte: sevenDaysAgo },
        isActive: true,
      })
        .populate('student', 'name rollNumber')
        .populate('admin', 'name')
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

      // Currently overdue outpasses
      const currentlyOverdue = await Outpass.countDocuments({
        isOverdue: true,
        status: OutpassStatus.CHECKED_OUT,
      });

      return {
        highOverdueStudents,
        recentOverrides,
        currentlyOverdue,
        overdueThreshold,
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch critical alerts', 500);
    }
  }

  /**
   * Get all users with filters and pagination
   */
  static async getAllUsers(filters: {
    search?: string;
    role?: UserRole;
    status?: 'active' | 'inactive';
    hostel?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const { search, role, status, hostel, page = 1, limit = 20 } = filters;
      const query: any = {};

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
        ];
      }

      // Role filter
      if (role !== undefined) {
        query.role = role;
      }

      // Status filter
      if (status) {
        query.isActive = status === 'active';
      }

      // Hostel filter
      if (hostel) {
        query.hostel = hostel;
      }

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch users', 500);
    }
  }

  /**
   * Create a new user (role-based)
   */
  static async createUser(
    userData: {
      name: string;
      email: string;
      password: string;
      phone: string;
      role: UserRole;
      rollNumber?: string;
      department?: string;
      year?: number;
      hostel?: string;
      roomNumber?: string;
      parentPhone?: string;
      assignedGate?: string;
      assignedHostel?: string;
      assignedHostels?: string[];
    },
    adminId: string
  ) {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError('Email already exists', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      // Log admin action
      await AdminActionLog.create({
        admin: adminId,
        action: 'user_created',
        targetType: 'user',
        targetId: user._id,
        details: {
          after: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        timestamp: new Date(),
      });

      return user.toJSON();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create user', 500);
    }
  }

  /**
   * Update user details
   */
  static async updateUser(
    userId: string,
    updates: {
      name?: string;
      phone?: string;
      rollNumber?: string;
      department?: string;
      year?: number;
      hostel?: string;
      roomNumber?: string;
      parentPhone?: string;
      assignedGate?: string;
      assignedHostel?: string;
      assignedHostels?: string[];
    },
    adminId: string
  ) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const before = user.toJSON();

      // Update user
      Object.assign(user, updates);
      await user.save();

      // Log admin action
      await AdminActionLog.create({
        admin: adminId,
        action: 'user_updated',
        targetType: 'user',
        targetId: user._id,
        details: {
          before,
          after: user.toJSON(),
        },
        timestamp: new Date(),
      });

      return user.toJSON();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update user', 500);
    }
  }

  /**
   * Delete user (with cascade handling)
   */
  static async deleteUser(userId: string, adminId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Prevent deleting admins
      if (user.role === UserRole.ADMIN) {
        throw new AppError('Cannot delete admin users', 403);
      }

      const before = user.toJSON();

      // Delete related data
      await Promise.all([
        Outpass.deleteMany({ student: userId }),
        Notification.deleteMany({ user: userId }),
        StudentOverride.deleteMany({ student: userId }),
      ]);

      // Delete user
      await user.deleteOne();

      // Log admin action
      await AdminActionLog.create({
        admin: adminId,
        action: 'user_deleted',
        targetType: 'user',
        targetId: userId,
        details: {
          before,
        },
        timestamp: new Date(),
      });

      return { message: 'User deleted successfully' };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete user', 500);
    }
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(userId: string, adminId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const before = { isActive: user.isActive };
      user.isActive = !user.isActive;
      await user.save();

      // Log admin action
      await AdminActionLog.create({
        admin: adminId,
        action: 'user_status_toggled',
        targetType: 'user',
        targetId: user._id,
        details: {
          before,
          after: { isActive: user.isActive },
        },
        timestamp: new Date(),
      });

      return user.toJSON();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to toggle user status', 500);
    }
  }

  /**
   * Override student restriction (with audit trail)
   */
  static async overrideStudentRestriction(
    studentId: string,
    adminId: string,
    reason: string,
    overrideType: 'restriction_lifted' | 'overdue_reset' | 'manual_approval'
  ) {
    try {
      const student = await User.findById(studentId);
      if (!student) {
        throw new AppError('Student not found', 404);
      }

      if (student.role !== UserRole.STUDENT) {
        throw new AppError('User is not a student', 400);
      }

      // Store previous state
      const previousState = {
        overdueCount: student.overdueCount,
        canCreateOutpass: student.canCreateOutpass,
        restrictionStatus: student.restrictionStatus,
      };

      // Apply override based on type
      let newState;
      switch (overrideType) {
        case 'restriction_lifted':
          student.canCreateOutpass = true;
          student.restrictionStatus = 'overridden';
          newState = {
            overdueCount: student.overdueCount,
            canCreateOutpass: true,
            restrictionStatus: 'overridden',
          };
          break;
        case 'overdue_reset':
          student.overdueCount = 0;
          student.canCreateOutpass = true;
          student.restrictionStatus = 'none';
          newState = {
            overdueCount: 0,
            canCreateOutpass: true,
            restrictionStatus: 'none',
          };
          break;
        case 'manual_approval':
          student.canCreateOutpass = true;
          student.restrictionStatus = 'overridden';
          newState = {
            overdueCount: student.overdueCount,
            canCreateOutpass: true,
            restrictionStatus: 'overridden',
          };
          break;
      }

      // Update override tracking
      student.overrideCount += 1;
      student.lastOverrideDate = new Date();
      student.lastOverrideBy = adminId as any;

      await student.save();

      // Create override record
      await StudentOverride.create({
        student: studentId,
        admin: adminId,
        reason,
        overrideType,
        previousState,
        newState,
        timestamp: new Date(),
        isActive: true,
      });

      // Log admin action
      await AdminActionLog.create({
        admin: adminId,
        action: 'user_restriction_overridden',
        targetType: 'user',
        targetId: student._id,
        details: {
          before: previousState,
          after: newState,
          reason,
          overrideType,
        },
        timestamp: new Date(),
      });

      // Send notification to student
      await Notification.create({
        user: studentId,
        title: 'Restriction Override',
        message: `Your account restriction has been overridden by an administrator. Reason: ${reason}`,
        type: 'success',
      });

      return student.toJSON();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to override restriction', 500);
    }
  }

  /**
   * Get user by ID with full details
   */
  static async getUserById(userId: string) {
    try {
      const user = await User.findById(userId)
        .select('-password')
        .populate('lastOverrideBy', 'name email')
        .lean();

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch user', 500);
    }
  }

  /**
   * Unlock user account (simplified version of override for quick unlock)
   */
  static async unlockUser(userId: string, adminId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.role !== UserRole.STUDENT) {
        throw new AppError('Only student accounts can be unlocked', 400);
      }

      // Store previous state
      const previousState = {
        canCreateOutpass: user.canCreateOutpass,
        restrictionStatus: user.restrictionStatus,
      };

      // Unlock the account
      user.canCreateOutpass = true;
      user.restrictionStatus = 'overridden';
      user.overrideCount += 1;
      user.lastOverrideDate = new Date();
      user.lastOverrideBy = adminId as any;

      await user.save();

      // Create override record
      await StudentOverride.create({
        student: userId,
        admin: adminId,
        reason: 'Quick unlock by admin',
        overrideType: 'restriction_lifted',
        previousState,
        newState: {
          canCreateOutpass: true,
          restrictionStatus: 'overridden',
        },
        timestamp: new Date(),
        isActive: true,
      });

      // Log admin action
      await AdminActionLog.create({
        admin: adminId,
        action: 'user_unlocked',
        targetType: 'user',
        targetId: user._id,
        details: {
          before: previousState,
          after: {
            canCreateOutpass: true,
            restrictionStatus: 'overridden',
          },
        },
        timestamp: new Date(),
      });

      // Send notification to student
      await Notification.create({
        user: userId,
        title: 'Account Unlocked',
        message: 'Your account has been unlocked by an administrator. You can now create outpasses.',
        type: 'success',
      });

      return user.toJSON();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to unlock user', 500);
    }
  }

  /**
   * Toggle outpass permission for a student
   */
  static async toggleOutpassPermission(
    userId: string,
    canCreateOutpass: boolean,
    adminId: string
  ) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.role !== UserRole.STUDENT) {
        throw new AppError('Only student accounts can have outpass permission toggled', 400);
      }

      // Store previous state with all required fields
      const previousState = {
        canCreateOutpass: user.canCreateOutpass,
        restrictionStatus: user.restrictionStatus,
        overdueCount: user.overdueCount,
      };

      // Update permission
      user.canCreateOutpass = canCreateOutpass;
      
      // If enabling permission, reset overdue count and update restriction status
      if (canCreateOutpass) {
        user.overdueCount = 0; // Reset overdue count when admin enables permission
        user.restrictionStatus = 'overridden';
        user.overrideCount += 1;
        user.lastOverrideDate = new Date();
        user.lastOverrideBy = adminId as any;
      } else {
        // If disabling, set to restricted
        user.restrictionStatus = 'restricted';
      }

      await user.save();

      // Create override record with all required fields
      await StudentOverride.create({
        student: userId,
        admin: adminId,
        reason: canCreateOutpass ? 'Outpass permission enabled by admin' : 'Outpass permission disabled by admin',
        overrideType: canCreateOutpass ? 'restriction_lifted' : 'manual_approval',
        previousState,
        newState: {
          canCreateOutpass: user.canCreateOutpass,
          restrictionStatus: user.restrictionStatus,
          overdueCount: user.overdueCount,
        },
        timestamp: new Date(),
        isActive: true,
      });

      // Log admin action
      await AdminActionLog.create({
        admin: adminId,
        action: 'outpass_permission_toggled',
        targetType: 'user',
        targetId: user._id,
        details: {
          before: previousState,
          after: {
            canCreateOutpass: user.canCreateOutpass,
            restrictionStatus: user.restrictionStatus,
            overdueCount: user.overdueCount,
          },
        },
        timestamp: new Date(),
      });

      // Send notification to student
      await Notification.create({
        user: userId,
        title: canCreateOutpass ? 'Outpass Permission Enabled' : 'Outpass Permission Disabled',
        message: canCreateOutpass
          ? 'Your outpass creation permission has been enabled by an administrator. Your overdue count has been reset.'
          : 'Your outpass creation permission has been disabled by an administrator.',
        type: canCreateOutpass ? 'success' : 'warning',
      });

      return user.toJSON();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to toggle outpass permission', 500);
    }
  }

  /**
   * Get system settings
   */
  static async getSystemSettings() {
    try {
      let settings = await SystemSettings.findOne();
      
      // Create default settings if none exist
      if (!settings) {
        settings = await SystemSettings.create({
          systemStatus: 'active',
          siteName: 'Campus Pass Management System',
          maxOutpassDuration: 7,
          qrCodeExpiry: 24,
          overdueCheckInterval: 15,
          overdueThreshold: 3,
          autoApprovalEnabled: false,
          notificationsEnabled: true,
          qrEnforcementEnabled: true,
        });
      }

      return settings;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch system settings', 500);
    }
  }

  /**
   * Update system settings (with validation)
   */
  static async updateSystemSettings(
    updates: {
      systemStatus?: 'active' | 'inactive';
      siteName?: string;
      maxOutpassDuration?: number;
      qrCodeExpiry?: number;
      overdueCheckInterval?: number;
      overdueThreshold?: number;
      autoRejectionDays?: number;
      autoApprovalEnabled?: boolean;
      notificationsEnabled?: boolean;
    },
    adminId: string
  ) {
    try {
      let settings = await SystemSettings.findOne();
      
      if (!settings) {
        settings = await SystemSettings.create(updates);
      } else {
        const before = settings.toJSON();
        
        Object.assign(settings, updates);
        settings.lastUpdatedBy = adminId as any;
        settings.lastUpdatedAt = new Date();
        
        await settings.save();

        // Log admin action
        await AdminActionLog.create({
          admin: adminId,
          action: 'settings_updated',
          targetType: 'settings',
          details: {
            before,
            after: settings.toJSON(),
          },
          timestamp: new Date(),
        });
      }

      return settings;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update system settings', 500);
    }
  }

  /**
   * Get all outpasses (cross-hostel view)
   */
  static async getAllOutpasses(filters: {
    hostel?: string;
    student?: string;
    status?: OutpassStatus;
    fromDate?: string;
    toDate?: string;
    search?: string;
    purpose?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const { hostel, student, status, fromDate, toDate, search, purpose, page = 1, limit = 20 } = filters;
      const query: any = {};

      // Student filter
      if (student) {
        query.student = student;
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Purpose filter (case-insensitive partial match)
      if (purpose) {
        query.purpose = { $regex: purpose, $options: 'i' };
      }

      // Date range filter
      if (fromDate || toDate) {
        query.fromDate = {};
        if (fromDate) query.fromDate.$gte = new Date(fromDate);
        if (toDate) query.fromDate.$lte = new Date(toDate);
      }

      const skip = (page - 1) * limit;

      let outpassQuery = Outpass.find(query)
        .populate({
          path: 'student',
          select: 'name rollNumber email phone',
          populate: {
            path: 'hostel',
            select: 'name'
          }
        })
        .populate('warden', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Hostel filter (applied after population)
      const [outpasses, total] = await Promise.all([
        outpassQuery.lean(),
        Outpass.countDocuments(query),
      ]);

      // Filter by hostel and search if specified
      let filteredOutpasses = outpasses;
      
      if (hostel) {
        filteredOutpasses = filteredOutpasses.filter((op: any) =>
          op.student?.hostel?.name?.toLowerCase().includes(hostel.toLowerCase())
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredOutpasses = filteredOutpasses.filter((op: any) =>
          op.student?.name?.toLowerCase().includes(searchLower) ||
          op.student?.email?.toLowerCase().includes(searchLower) ||
          op.student?.rollNumber?.toLowerCase().includes(searchLower)
        );
      }

      return {
        outpasses: filteredOutpasses,
        pagination: {
          page,
          limit,
          total: (hostel || search) ? filteredOutpasses.length : total,
          pages: Math.ceil(((hostel || search) ? filteredOutpasses.length : total) / limit),
        },
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch outpasses', 500);
    }
  }

  /**
   * Get outpass by ID (admin can view any outpass)
   */
  static async getOutpassById(outpassId: string) {
    try {
      const outpass = await Outpass.findById(outpassId)
        .populate({
          path: 'student',
          select: 'name rollNumber email phone',
          populate: {
            path: 'hostel',
            select: 'name'
          }
        })
        .populate('warden', 'name email')
        .lean();

      if (!outpass) {
        throw new AppError('Outpass not found', 404);
      }

      return outpass;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to fetch outpass', 500);
    }
  }

  /**
   * Get hostel-wise statistics
   */
  static async getHostelStatistics() {
    try {
      // Get all hostels with their outpass counts
      // Note: User.hostel stores hostel NAME (string), not ID
      const hostelStats = await Outpass.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'student',
            foreignField: '_id',
            as: 'studentData'
          }
        },
        {
          $unwind: '$studentData'
        },
        {
          $lookup: {
            from: 'hostels',
            localField: 'studentData.hostel',
            foreignField: 'name', // Match by name, not _id
            as: 'hostelData'
          }
        },
        {
          $unwind: '$hostelData'
        },
        {
          $group: {
            _id: '$hostelData._id',
            hostelName: { $first: '$hostelData.name' },
            totalOutpasses: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            checkedOut: {
              $sum: { $cond: [{ $eq: ['$status', 'checked_out'] }, 1, 0] }
            },
            checkedIn: {
              $sum: { $cond: [{ $eq: ['$status', 'checked_in'] }, 1, 0] }
            },
            overdue: {
              $sum: { $cond: ['$isOverdue', 1, 0] }
            }
          }
        },
        {
          $sort: { totalOutpasses: -1 }
        }
      ]);

      // Get total students per hostel (hostel is stored as name string)
      const hostelStudentCounts = await User.aggregate([
        {
          $match: { role: UserRole.STUDENT, hostel: { $exists: true, $ne: null } }
        },
        {
          $lookup: {
            from: 'hostels',
            localField: 'hostel',
            foreignField: 'name',
            as: 'hostelData'
          }
        },
        {
          $unwind: '$hostelData'
        },
        {
          $group: {
            _id: '$hostelData._id',
            studentCount: { $sum: 1 }
          }
        }
      ]);

      // Merge student counts with outpass stats
      const studentCountMap = new Map(
        hostelStudentCounts.map(h => [h._id.toString(), h.studentCount])
      );

      const enrichedStats = hostelStats.map(stat => ({
        hostelId: stat._id,
        hostelName: stat.hostelName,
        totalOutpasses: stat.totalOutpasses,
        totalStudents: studentCountMap.get(stat._id.toString()) || 0,
        averageOutpassesPerStudent: studentCountMap.get(stat._id.toString())
          ? (stat.totalOutpasses / studentCountMap.get(stat._id.toString())!).toFixed(2)
          : '0',
        byStatus: {
          pending: stat.pending,
          approved: stat.approved,
          rejected: stat.rejected,
          checkedOut: stat.checkedOut,
          checkedIn: stat.checkedIn,
          overdue: stat.overdue
        }
      }));

      return enrichedStats;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch hostel statistics', 500);
    }
  }

  /**
   * Override outpass status (with reason)
   */
  static async overrideOutpassStatus(
    outpassId: string,
    adminId: string,
    newStatus: OutpassStatus,
    reason: string
  ) {
    try {
      const outpass = await Outpass.findById(outpassId);
      if (!outpass) {
        throw new AppError('Outpass not found', 404);
      }

      const before = { status: outpass.status };
      outpass.status = newStatus;
      await outpass.save();

      // Log admin action
      await AdminActionLog.create({
        admin: adminId,
        action: 'outpass_status_overridden',
        targetType: 'outpass',
        targetId: outpass._id,
        details: {
          before,
          after: { status: newStatus },
          reason,
        },
        timestamp: new Date(),
      });

      // Notify student
      await Notification.create({
        user: outpass.student,
        title: 'Outpass Status Updated',
        message: `Your outpass status has been changed to ${newStatus} by an administrator. Reason: ${reason}`,
        type: 'info',
        relatedOutpass: outpass._id,
      });

      return outpass;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to override outpass status', 500);
    }
  }

  /**
   * Get audit logs (admin action history)
   */
  static async getAuditLogs(filters: {
    admin?: string;
    action?: string;
    targetType?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const { admin, action, targetType, fromDate, toDate, page = 1, limit = 50 } = filters;
      const query: any = {};

      if (admin) query.admin = admin;
      if (action) query.action = action;
      if (targetType) query.targetType = targetType;

      if (fromDate || toDate) {
        query.timestamp = {};
        if (fromDate) query.timestamp.$gte = new Date(fromDate);
        if (toDate) query.timestamp.$lte = new Date(toDate);
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AdminActionLog.find(query)
          .populate('admin', 'name email')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AdminActionLog.countDocuments(query),
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to fetch audit logs', 500);
    }
  }
}

// 