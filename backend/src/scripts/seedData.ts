import 'dotenv/config';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Hostel } from '../models/Hostel';
import { Outpass } from '../models/Outpass';
import { SystemSettings } from '../models/SystemSettings';
import { hashPassword } from '../utils/hash';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// Helper to generate random date within range
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to get random item from array
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function seedDatabase() {
  try {
    await connectDatabase();
    logger.info('Connected to database');

    // Clear existing data
    logger.info('Clearing existing data...');
    await User.deleteMany({});
    await Hostel.deleteMany({});
    await Outpass.deleteMany({});
    await SystemSettings.deleteMany({});
    logger.info('✅ Existing data cleared');

    // Create Hostels
    logger.info('Creating hostels...');
    const hostels = await Hostel.insertMany([
      {
        name: 'Phoenix Hall',
        code: 'PHOENIX',
        type: 'boys',
        capacity: 150,
        currentOccupancy: 120,
        address: 'North Campus, Block A',
        contactNumber: '9876543210',
        facilities: ['WiFi', 'Gym', 'Common Room', 'Laundry'],
        isActive: true,
      },
      {
        name: 'Aurora Residence',
        code: 'AURORA',
        type: 'girls',
        capacity: 120,
        currentOccupancy: 95,
        address: 'South Campus, Block B',
        contactNumber: '9876543211',
        facilities: ['WiFi', 'Study Room', 'Common Room', 'Laundry'],
        isActive: true,
      },
      {
        name: 'Zenith Tower',
        code: 'ZENITH',
        type: 'boys',
        capacity: 180,
        currentOccupancy: 150,
        address: 'East Campus, Block C',
        contactNumber: '9876543212',
        facilities: ['WiFi', 'Gym', 'Gaming Room', 'Laundry'],
        isActive: true,
      },
      {
        name: 'Harmony Lodge',
        code: 'HARMONY',
        type: 'girls',
        capacity: 100,
        currentOccupancy: 80,
        address: 'West Campus, Block D',
        contactNumber: '9876543213',
        facilities: ['WiFi', 'Library', 'Common Room', 'Laundry'],
        isActive: true,
      },
      {
        name: 'Unity House',
        code: 'UNITY',
        type: 'mixed',
        capacity: 200,
        currentOccupancy: 170,
        address: 'Central Campus, Block E',
        contactNumber: '9876543214',
        facilities: ['WiFi', 'Cafeteria', 'Study Room', 'Gym', 'Laundry'],
        isActive: true,
      },
    ]);
    logger.info(`✅ Created ${hostels.length} hostels`);

    // Create Admin
    logger.info('Creating admin user...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@gmail.com',
      password: await hashPassword('admin123'),
      phone: '9999999999',
      role: 0, // ADMIN
      isActive: true,
    });
    logger.info('✅ Admin created');

    // Create Wardens
    logger.info('Creating wardens...');
    const wardens = await User.insertMany([
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@gmail.com',
        password: await hashPassword('warden123'),
        phone: '9876543220',
        role: 2, // WARDEN
        hostel: hostels[0].name, // Phoenix Hall
        isActive: true,
      },
      {
        name: 'Prof. Priya Sharma',
        email: 'priya.sharma@gmail.com',
        password: await hashPassword('warden123'),
        phone: '9876543221',
        role: 2,
        hostel: hostels[1].name, // Aurora Residence
        isActive: true,
      },
      {
        name: 'Dr. Amit Patel',
        email: 'amit.patel@gmail.com',
        password: await hashPassword('warden123'),
        phone: '9876543222',
        role: 2,
        hostel: hostels[2].name, // Zenith Tower
        isActive: true,
      },
      {
        name: 'Prof. Sneha Reddy',
        email: 'sneha.reddy@gmail.com',
        password: await hashPassword('warden123'),
        phone: '9876543223',
        role: 2,
        hostel: hostels[3].name, // Harmony Lodge
        isActive: true,
      },
      {
        name: 'Dr. Vikram Singh',
        email: 'vikram.singh@gmail.com',
        password: await hashPassword('warden123'),
        phone: '9876543224',
        role: 2,
        hostel: hostels[4].name, // Unity House
        isActive: true,
      },
    ]);
    logger.info(`✅ Created ${wardens.length} wardens`);

    // Update hostels with warden references
    for (let i = 0; i < hostels.length; i++) {
      hostels[i].warden = wardens[i]._id;
      await hostels[i].save();
    }
    logger.info('✅ Updated hostels with warden references');

    // Create Security Personnel
    logger.info('Creating security personnel...');
    const security = await User.insertMany([
      {
        name: 'Ramesh Gupta',
        email: 'ramesh.gupta@gmail.com',
        password: await hashPassword('security123'),
        phone: '9876543230',
        role: 3, // SECURITY
        isActive: true,
      },
      {
        name: 'Suresh Yadav',
        email: 'suresh.yadav@gmail.com',
        password: await hashPassword('security123'),
        phone: '9876543231',
        role: 3,
        isActive: true,
      },
    ]);
    logger.info(`✅ Created ${security.length} security personnel`);

    // Create Students
    logger.info('Creating students...');
    const studentNames = [
      'Aarav Mehta', 'Vivaan Joshi', 'Aditya Verma', 'Vihaan Kapoor', 'Arjun Nair',
      'Sai Krishnan', 'Arnav Desai', 'Dhruv Malhotra', 'Kabir Agarwal', 'Shivansh Rao',
      'Ananya Iyer', 'Diya Chatterjee', 'Isha Kulkarni', 'Anvi Bose', 'Saanvi Menon',
      'Aadhya Pillai', 'Kiara Banerjee', 'Myra Sinha', 'Aanya Ghosh', 'Navya Mukherjee',
      'Reyansh Pandey', 'Ayaan Shah', 'Atharv Jain', 'Krishna Mishra', 'Advait Saxena',
      'Riya Gupta', 'Sara Thakur', 'Zara Bhatt', 'Mira Dubey', 'Tara Chawla',
    ];

    const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
    const students = [];

    for (let i = 0; i < studentNames.length; i++) {
      const hostel = hostels[i % hostels.length];
      const student = await User.create({
        name: studentNames[i],
        email: `${studentNames[i].toLowerCase().replace(' ', '.')}@gmail.com`,
        password: await hashPassword('student123'),
        phone: `98765432${40 + i}`,
        role: 1, // STUDENT
        rollNumber: `2024${String(i + 1).padStart(3, '0')}`,
        department: randomItem(departments),
        year: Math.floor(Math.random() * 4) + 1,
        hostel: hostel.name,
        roomNumber: `${Math.floor(Math.random() * 3) + 1}${String(Math.floor(Math.random() * 50) + 1).padStart(2, '0')}`,
        parentPhone: `98765${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
        isActive: true,
        overdueCount: 0,
        canCreateOutpass: true,
      });
      students.push(student);
    }
    logger.info(`✅ Created ${students.length} students`);

    // Create diverse outpasses
    logger.info('Creating outpasses...');
    const purposes: Array<'home' | 'medical' | 'personal' | 'emergency' | 'other'> = ['home', 'medical', 'personal', 'emergency', 'other'];
    const purposeReasons = {
      home: 'Going home to visit family and attend to personal matters at home',
      medical: 'Need to visit hospital for medical checkup and consultation with doctor',
      personal: 'Personal work related to bank, documentation and other important tasks',
      emergency: 'Family emergency requiring immediate attention and presence at home',
      other: 'Other important work that requires leaving campus premises temporarily',
    };
    const statuses = ['pending', 'approved', 'rejected', 'checked_out', 'checked_in', 'overdue'];
    const outpasses = [];

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 100; i++) {
      const student = randomItem(students);
      const warden = wardens.find(w => w.hostel === student.hostel);
      const status = randomItem(statuses);
      const purpose = randomItem(purposes);
      
      const fromDate = randomDate(oneMonthAgo, now);
      const toDate = new Date(fromDate.getTime() + (Math.random() * 48 + 24) * 60 * 60 * 1000);
      
      const outpassData: any = {
        student: student._id, // Use ObjectId directly
        reason: purposeReasons[purpose],
        destination: randomItem(['Home', 'City Hospital', 'City Center', 'Relative Place', 'Medical Clinic']),
        fromDate,
        toDate,
        fromTime: '10:00',
        toTime: '18:00',
        purpose,
        emergencyContact: `98765${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
        contactNumber: `98765${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
        status,
        createdAt: fromDate,
      };

      // Add warden info for approved/rejected/checked_out/checked_in/overdue
      if (status !== 'pending' && warden) {
        outpassData.warden = warden._id;
        outpassData.approvedAt = new Date(fromDate.getTime() + Math.random() * 2 * 60 * 60 * 1000);
      }

      // Add rejection reason for rejected
      if (status === 'rejected') {
        outpassData.rejectionReason = randomItem([
          'Insufficient reason provided',
          'Too many pending outpasses',
          'Academic performance concerns',
          'Previous overdue record',
        ]);
        outpassData.rejectedAt = outpassData.approvedAt;
      }

      // Add check-out info for checked_out/checked_in/overdue
      if (['checked_out', 'checked_in', 'overdue'].includes(status)) {
        const securityPerson = randomItem(security);
        outpassData.checkOut = {
          time: new Date(fromDate.getTime() + Math.random() * 4 * 60 * 60 * 1000),
          securityId: securityPerson._id,
          securityName: securityPerson.name,
        };
      }

      // Add check-in info for checked_in
      if (status === 'checked_in') {
        const securityPerson = randomItem(security);
        outpassData.checkIn = {
          time: new Date(toDate.getTime() - Math.random() * 2 * 60 * 60 * 1000),
          securityId: securityPerson._id,
          securityName: securityPerson.name,
        };
      }

      // For overdue, set toDate in the past
      if (status === 'overdue') {
        outpassData.toDate = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      }

      const outpass = await Outpass.create(outpassData);
      outpasses.push(outpass);
    }
    logger.info(`✅ Created ${outpasses.length} outpasses`);

    // Create System Settings
    logger.info('Creating system settings...');
    await SystemSettings.create({
      systemStatus: 'active',
      siteName: 'Campus Pass Management System',
      maxOutpassDuration: 7, // 7 days
      qrCodeExpiry: 24, // 24 hours
      overdueCheckInterval: 15, // 15 minutes
      overdueThreshold: 3,
      autoRejectionDays: 3,
      autoApprovalEnabled: false,
      notificationsEnabled: true,
      qrEnforcementEnabled: true,
      lastUpdatedBy: admin._id,
      lastUpdatedAt: new Date(),
    });
    logger.info('✅ System settings created');

    // Summary
    logger.info('\n========== SEED DATA SUMMARY ==========');
    logger.info(`✅ Hostels: ${hostels.length}`);
    logger.info(`✅ Admin: 1`);
    logger.info(`✅ Wardens: ${wardens.length}`);
    logger.info(`✅ Security: ${security.length}`);
    logger.info(`✅ Students: ${students.length}`);
    logger.info(`✅ Outpasses: ${outpasses.length}`);
    logger.info('\n========== LOGIN CREDENTIALS ==========');
    logger.info('Admin: admin@gmail.com / admin123');
    logger.info('Warden: rajesh.kumar@gmail.com / warden123');
    logger.info('Security: ramesh.gupta@gmail.com / security123');
    logger.info('Student: aarav.mehta@gmail.com / student123');
    logger.info('=======================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();

// 