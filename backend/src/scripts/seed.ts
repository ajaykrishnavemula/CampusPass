import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Hostel } from '../models/Hostel';
import { Outpass } from '../models/Outpass';
import { SystemSettings } from '../models/SystemSettings';
import { hashPassword } from '../utils/hash';
import { UserRole } from '../types';
import { logger } from '../utils/logger';

const seedDatabase = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-pass';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Hostel.deleteMany({});
    await Outpass.deleteMany({});
    await SystemSettings.deleteMany({});
    logger.info('Cleared existing data');

    // Create System Settings
    await SystemSettings.create({
      isSystemActive: true,
      maxOutpassDuration: 7,
      autoApprovalEnabled: false,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      overdueCheckInterval: 60,
      qrCodeExpiryHours: 24,
      maintenanceMode: false,
      allowedOutpassPurposes: ['medical', 'personal', 'family', 'emergency', 'other'],
    });
    logger.info('✅ System settings created');

    // Create Hostels
    const hostel1 = await Hostel.create({
      name: 'Sunrise Boys Hostel',
      code: 'SBH',
      type: 'boys',
      capacity: 200,
      currentOccupancy: 3,
      address: 'Campus Block A, University Road',
      contactNumber: '9876543200',
      facilities: ['WiFi', 'Gym', 'Library', 'Mess', 'Common Room'],
      isActive: true,
    });

    const hostel2 = await Hostel.create({
      name: 'Moonlight Girls Hostel',
      code: 'MGH',
      type: 'girls',
      capacity: 180,
      currentOccupancy: 3,
      address: 'Campus Block B, University Road',
      contactNumber: '9876543201',
      facilities: ['WiFi', 'Gym', 'Library', 'Mess', 'Common Room', 'Security'],
      isActive: true,
    });

    const hostel3 = await Hostel.create({
      name: 'Horizon Mixed Hostel',
      code: 'HMH',
      type: 'mixed',
      capacity: 250,
      currentOccupancy: 3,
      address: 'Campus Block C, University Road',
      contactNumber: '9876543202',
      facilities: ['WiFi', 'Gym', 'Library', 'Mess', 'Common Room', 'Sports Complex'],
      isActive: true,
    });

    logger.info('✅ Hostels created');

    // Create Admin User
    await User.create({
      name: 'System Administrator',
      email: 'admin@campuspass.com',
      password: await hashPassword('admin123'),
      role: UserRole.ADMIN,
      phone: '9876543210',
      isActive: true,
    });
    logger.info('✅ Admin user created');

    // Create Wardens (one per hostel)
    const warden1 = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'warden.sbh@campuspass.com',
      password: await hashPassword('warden123'),
      role: UserRole.WARDEN,
      phone: '9876543211',
      department: 'Sunrise Boys Hostel',
      hostel: 'Sunrise Boys Hostel',
      isActive: true,
    });

    const warden2 = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'warden.mgh@campuspass.com',
      password: await hashPassword('warden123'),
      role: UserRole.WARDEN,
      phone: '9876543212',
      department: 'Moonlight Girls Hostel',
      hostel: 'Moonlight Girls Hostel',
      isActive: true,
    });

    const warden3 = await User.create({
      name: 'Dr. Amit Patel',
      email: 'warden.hmh@campuspass.com',
      password: await hashPassword('warden123'),
      role: UserRole.WARDEN,
      phone: '9876543213',
      department: 'Horizon Mixed Hostel',
      hostel: 'Horizon Mixed Hostel',
      isActive: true,
    });

    logger.info('✅ Warden users created');

    // Update hostels with wardens
    hostel1.warden = warden1._id;
    await hostel1.save();
    hostel2.warden = warden2._id;
    await hostel2.save();
    hostel3.warden = warden3._id;
    await hostel3.save();
    logger.info('✅ Hostels updated with wardens');

    // Create Security Users
    await User.create({
      name: 'Ramesh Singh',
      email: 'security.main@campuspass.com',
      password: await hashPassword('security123'),
      role: UserRole.SECURITY,
      phone: '9876543214',
      department: 'Main Gate',
      isActive: true,
    });

    await User.create({
      name: 'Suresh Patel',
      email: 'security.back@campuspass.com',
      password: await hashPassword('security123'),
      role: UserRole.SECURITY,
      phone: '9876543215',
      department: 'Back Gate',
      isActive: true,
    });

    logger.info('✅ Security users created');

    // Create Students (3 per hostel = 9 total)
    const students = [
      // Sunrise Boys Hostel (3 students)
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'SBH2101',
        department: 'Computer Science',
        year: 2,
        phone: '9876543220',
        parentPhone: '9876543230',
        hostel: 'Sunrise Boys Hostel',
        roomNumber: '101',
        isActive: true,
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'SBH2102',
        department: 'Mechanical Engineering',
        year: 2,
        phone: '9876543221',
        parentPhone: '9876543231',
        hostel: 'Sunrise Boys Hostel',
        roomNumber: '102',
        isActive: true,
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'SBH2103',
        department: 'Electrical Engineering',
        year: 2,
        phone: '9876543222',
        parentPhone: '9876543232',
        hostel: 'Sunrise Boys Hostel',
        roomNumber: '103',
        isActive: true,
      },
      // Moonlight Girls Hostel (3 students)
      {
        name: 'Priya Verma',
        email: 'priya.verma@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'MGH2101',
        department: 'Computer Science',
        year: 2,
        phone: '9876543223',
        parentPhone: '9876543233',
        hostel: 'Moonlight Girls Hostel',
        roomNumber: '201',
        isActive: true,
      },
      {
        name: 'Sneha Patel',
        email: 'sneha.patel@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'MGH2102',
        department: 'Electronics',
        year: 2,
        phone: '9876543224',
        parentPhone: '9876543234',
        hostel: 'Moonlight Girls Hostel',
        roomNumber: '202',
        isActive: true,
      },
      {
        name: 'Anjali Reddy',
        email: 'anjali.reddy@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'MGH2103',
        department: 'Civil Engineering',
        year: 2,
        phone: '9876543225',
        parentPhone: '9876543235',
        hostel: 'Moonlight Girls Hostel',
        roomNumber: '203',
        isActive: true,
      },
      // Horizon Mixed Hostel (3 students)
      {
        name: 'Arjun Mehta',
        email: 'arjun.mehta@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'HMH2101',
        department: 'Information Technology',
        year: 2,
        phone: '9876543226',
        parentPhone: '9876543236',
        hostel: 'Horizon Mixed Hostel',
        roomNumber: '301',
        isActive: true,
      },
      {
        name: 'Kavya Nair',
        email: 'kavya.nair@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'HMH2102',
        department: 'Biotechnology',
        year: 2,
        phone: '9876543227',
        parentPhone: '9876543237',
        hostel: 'Horizon Mixed Hostel',
        roomNumber: '302',
        isActive: true,
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan.gupta@student.campuspass.com',
        password: await hashPassword('student123'),
        role: UserRole.STUDENT,
        rollNumber: 'HMH2103',
        department: 'Chemical Engineering',
        year: 2,
        phone: '9876543228',
        parentPhone: '9876543238',
        hostel: 'Horizon Mixed Hostel',
        roomNumber: '303',
        isActive: true,
      },
    ];

    const createdStudents = await User.insertMany(students);
    logger.info('✅ Student users created (9 students - 3 per hostel)');

    // Create sample outpasses for demonstration (100 outpasses for realistic data)
    const purposes = ['home', 'medical', 'personal', 'emergency', 'other'];
    const statuses = ['pending', 'approved', 'rejected', 'checked_out', 'checked_in'];
    const now = new Date();
    const outpasses = [];

    // Create 100 outpasses with varied distribution
    for (let i = 0; i < 100; i++) {
      const student = createdStudents[i % createdStudents.length];
      const status = statuses[i % statuses.length];
      const purpose = purposes[i % purposes.length];
      
      // Vary dates more - some recent, some older
      const daysBack = Math.floor(Math.random() * 30); // 0-30 days back
      const fromDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const toDate = new Date(fromDate.getTime() + (Math.random() * 3 + 1) * 24 * 60 * 60 * 1000);
      
      const outpass: any = {
        student: student._id,
        reason: `${purpose.charAt(0).toUpperCase() + purpose.slice(1)} related work - Sample outpass ${i + 1}`,
        destination: ['Home', 'Hospital', 'City Center', 'Relative Place'][Math.floor(Math.random() * 4)],
        fromDate,
        toDate,
        purpose,
        emergencyContact: '9876543299',
        status,
      };

      // Add warden info for approved/rejected outpasses
      if (status === 'approved' || status === 'rejected' || status === 'checked_out' || status === 'checked_in') {
        const wardenForHostel = student.hostel === 'Sunrise Boys Hostel' ? warden1._id :
                                student.hostel === 'Moonlight Girls Hostel' ? warden2._id : warden3._id;
        outpass.warden = wardenForHostel;
        outpass.approvedAt = status === 'approved' || status === 'checked_out' || status === 'checked_in' ?
                            new Date(fromDate.getTime() - 24 * 60 * 60 * 1000) : null;
        outpass.rejectedAt = status === 'rejected' ? new Date(fromDate.getTime() - 24 * 60 * 60 * 1000) : null;
        outpass.rejectionReason = status === 'rejected' ? 'Sample rejection reason' : null;
      }

      // Add check-in/out times for checked statuses
      if (status === 'checked_out' || status === 'checked_in') {
        outpass.checkOutTime = fromDate;
        if (status === 'checked_in') {
          outpass.checkInTime = new Date(fromDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
        }
      }

      outpasses.push(outpass);
    }

    await Outpass.insertMany(outpasses);
    logger.info('✅ Sample outpasses created (100 outpasses across all students)');

    logger.info('\n📊 Database Seeding Summary:');
    logger.info('================================');
    logger.info('✅ 1 System Admin');
    logger.info('✅ 3 Hostels (Sunrise Boys, Moonlight Girls, Horizon Mixed)');
    logger.info('✅ 3 Wardens (1 per hostel)');
    logger.info('✅ 2 Security Personnel');
    logger.info('✅ 9 Students (3 per hostel)');
    logger.info('✅ 100 Sample Outpasses (various statuses)');
    logger.info('================================');
    logger.info('\n🔐 Login Credentials:');
    logger.info('Admin: admin@campuspass.com / admin123');
    logger.info('Warden (SBH): warden.sbh@campuspass.com / warden123');
    logger.info('Warden (MGH): warden.mgh@campuspass.com / warden123');
    logger.info('Warden (HMH): warden.hmh@campuspass.com / warden123');
    logger.info('Security: security.main@campuspass.com / security123');
    logger.info('Student: amit.kumar@student.campuspass.com / student123');
    logger.info('================================\n');

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();

// 