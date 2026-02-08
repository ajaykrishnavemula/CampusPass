import { User, Outpass } from '../models';
import { UserRole, OutpassStatus } from '../types';

export class WardenService {
  /**
   * Get warden's hostel students
   */
  static async getWardenHostelStudents(wardenId: string) {
    const warden = await User.findById(wardenId);
    if (!warden || !warden.hostel) {
      throw new Error('Warden hostel not assigned. Please contact admin.');
    }

    const hostelStudents = await User.find({
      hostel: warden.hostel,
      role: UserRole.STUDENT,
    }).select('_id name email rollNumber phone department year');

    return {
      warden,
      hostelStudents,
      studentIds: hostelStudents.map((s) => s._id),
    };
  }

  /**
   * Get all outpasses for warden's hostel with filters
   */
  static async getAllOutpasses(
    wardenId: string,
    filters: {
      status?: string;
      dateRange?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { status, dateRange, search, page = 1, limit = 20 } = filters;

    // Get warden and student IDs only (optimized - no need for full student data)
    const warden = await User.findById(wardenId);
    if (!warden || !warden.hostel) {
      throw new Error('Warden hostel not assigned. Please contact admin.');
    }

    const studentIds = await User.find({
      hostel: warden.hostel,
      role: UserRole.STUDENT,
    }).distinct('_id');

    // Build query
    const query: any = { student: { $in: studentIds } };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'last7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'lastMonth':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      query.createdAt = { $gte: startDate };
    }

    // Search filter - use MongoDB query instead of in-memory filtering
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchStudentIds = await User.find({
        hostel: warden.hostel,
        role: UserRole.STUDENT,
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { rollNumber: searchRegex },
        ],
      }).distinct('_id');
      
      query.student = { $in: searchStudentIds };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .populate('student', 'name email rollNumber phone department year')
        .populate('warden', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Outpass.countDocuments(query),
    ]);

    return {
      outpasses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get warden dashboard statistics
   */
  static async getDashboardStats(wardenId: string) {
    // Get warden's hostel students
    const { warden, studentIds } = await this.getWardenHostelStudents(wardenId);

    // Calculate statistics
    const [
      totalOutpasses,
      pendingOutpasses,
      approvedOutpasses,
      rejectedOutpasses,
      overdueOutpasses,
    ] = await Promise.all([
      Outpass.countDocuments({ student: { $in: studentIds } }),
      Outpass.countDocuments({ student: { $in: studentIds }, status: OutpassStatus.PENDING }),
      Outpass.countDocuments({ student: { $in: studentIds }, status: OutpassStatus.APPROVED }),
      Outpass.countDocuments({ student: { $in: studentIds }, status: OutpassStatus.REJECTED }),
      Outpass.countDocuments({ student: { $in: studentIds }, isOverdue: true }),
    ]);

    return {
      stats: {
        total: totalOutpasses,
        pending: pendingOutpasses,
        approved: approvedOutpasses,
        rejected: rejectedOutpasses,
        overdue: overdueOutpasses,
        hostel: {
          id: warden.hostel,
          name: warden.hostel,
        },
      },
    };
  }

  /**
   * Get hostel information for warden
   */
  static async getHostelInfo(wardenId: string) {
    const warden = await User.findById(wardenId);
    if (!warden || !warden.hostel) {
      throw new Error('Warden hostel not assigned. Please contact admin.');
    }

    const studentCount = await User.countDocuments({
      hostel: warden.hostel,
      role: UserRole.STUDENT,
    });

    return {
      hostel: warden.hostel,
      wardenName: warden.name,
      studentCount,
    };
  }

  /**
   * Get statistics for warden dashboard
   */
  static async getStatistics(wardenId: string) {
    const { studentIds } = await this.getWardenHostelStudents(wardenId);

    const [
      pending,
      approvedToday,
      rejected,
      activeOutside,
      overdue,
      totalStudents,
    ] = await Promise.all([
      Outpass.countDocuments({ student: { $in: studentIds }, status: OutpassStatus.PENDING }),
      Outpass.countDocuments({
        student: { $in: studentIds },
        status: OutpassStatus.APPROVED,
        approvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Outpass.countDocuments({ student: { $in: studentIds }, status: OutpassStatus.REJECTED }),
      Outpass.countDocuments({
        student: { $in: studentIds },
        status: OutpassStatus.CHECKED_OUT,
      }),
      Outpass.countDocuments({ student: { $in: studentIds }, isOverdue: true }),
      User.countDocuments({ _id: { $in: studentIds } }),
    ]);

    return {
      pending,
      approvedToday,
      rejected,
      activeOutside,
      overdue,
      totalStudents,
    };
  }

  /**
   * Get analytics data for charts
   */
  static async getAnalytics(wardenId: string) {
    const { studentIds } = await this.getWardenHostelStudents(wardenId);

    // Status breakdown for donut chart
    const statusBreakdownRaw = await Outpass.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Transform to object format expected by frontend
    const statusBreakdown = {
      pending: 0,
      approved: 0,
      rejected: 0,
      checked_out: 0,
      checked_in: 0,
      expired: 0,
    };

    statusBreakdownRaw.forEach((item: any) => {
      if (item._id in statusBreakdown) {
        statusBreakdown[item._id as keyof typeof statusBreakdown] = item.count;
      }
    });

    // Outpasses per day for last 7 days (bar chart)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyOutpassesRaw = await Outpass.aggregate([
      {
        $match: {
          student: { $in: studentIds },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Transform to array format expected by frontend
    const dailyOutpasses = dailyOutpassesRaw.map((item: any) => ({
      date: item._id,
      count: item.count,
    }));

    return {
      statusBreakdown,
      dailyOutpasses,
    };
  }

  /**
   * Get all outpasses with enhanced filtering
   */
  static async getOutpassesEnhanced(
    wardenId: string,
    filters: {
      status?: string;
      purpose?: string;
      search?: string;
      dateRange?: string;
      fromDate?: string;
      toDate?: string;
      overdueOnly?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const { status, purpose, search, dateRange, fromDate, toDate, overdueOnly, page = 1, limit = 20 } = filters;

    const warden = await User.findById(wardenId);
    if (!warden || !warden.hostel) {
      throw new Error('Warden hostel not assigned. Please contact admin.');
    }

    const studentIds = await User.find({
      hostel: warden.hostel,
      role: UserRole.STUDENT,
    }).distinct('_id');

    // Build query
    const query: any = { student: { $in: studentIds } };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Purpose filter
    if (purpose && purpose !== 'all') {
      query.purpose = purpose;
    }

    // Overdue filter
    if (overdueOnly) {
      query.isOverdue = true;
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'last7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'last30days':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = new Date(0);
      }

      query.createdAt = { $gte: startDate };
    }

    // Custom date range
    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchStudentIds = await User.find({
        hostel: warden.hostel,
        role: UserRole.STUDENT,
        $or: [
          { name: searchRegex },
          { rollNumber: searchRegex },
        ],
      }).distinct('_id');

      query.$or = [
        { student: { $in: searchStudentIds } },
        { destination: searchRegex },
        { reason: searchRegex },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .populate({
          path: 'student',
          select: 'name email rollNumber phone department year hostel roomNumber overdueCount canCreateOutpass',
        })
        .populate('warden', 'name email')
        .sort({ createdAt: -1 }) // Latest date first
        .skip(skip)
        .limit(limit),
      Outpass.countDocuments(query),
    ]);

    return {
      outpasses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve outpass with optional note
   */
  static async approveOutpass(wardenId: string, outpassId: string, note?: string) {
    // Verify access
    const hasAccess = await this.verifyWardenAccess(wardenId, outpassId);
    if (!hasAccess) {
      throw new Error('You do not have permission to approve this outpass');
    }

    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      throw new Error('Outpass not found');
    }

    if (outpass.status !== OutpassStatus.PENDING) {
      throw new Error('Only pending outpasses can be approved');
    }

    outpass.status = OutpassStatus.APPROVED;
    outpass.warden = wardenId as any;
    outpass.approvedAt = new Date();
    if (note) {
      outpass.wardenRemarks = note;
    }

    await outpass.save();

    return outpass;
  }

  /**
   * Reject outpass with mandatory reason
   */
  static async rejectOutpass(wardenId: string, outpassId: string, reason: string) {
    if (!reason || reason.trim().length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }

    // Verify access
    const hasAccess = await this.verifyWardenAccess(wardenId, outpassId);
    if (!hasAccess) {
      throw new Error('You do not have permission to reject this outpass');
    }

    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      throw new Error('Outpass not found');
    }

    if (outpass.status !== OutpassStatus.PENDING) {
      throw new Error('Only pending outpasses can be rejected');
    }

    outpass.status = OutpassStatus.REJECTED;
    outpass.warden = wardenId as any;
    outpass.rejectedAt = new Date();
    outpass.rejectionReason = reason.trim();

    await outpass.save();

    return outpass;
  }

  /**
   * Verify outpass belongs to warden's hostel
   */
  static async verifyWardenAccess(wardenId: string, outpassId: string): Promise<boolean> {
    const warden = await User.findById(wardenId);
    if (!warden || !warden.hostel) {
      return false;
    }

    const outpass = await Outpass.findById(outpassId).populate('student');
    if (!outpass) {
      return false;
    }

    const student = outpass.student as any;
    return student.hostel?.toString() === warden.hostel.toString();
  }
}

// 