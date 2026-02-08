import mongoose from 'mongoose';
import { config } from '../config';
import { User } from '../models/User';
import { Outpass } from '../models/Outpass';
import { logger } from '../utils/logger';

const createOutpasses = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB');

    // Get all students
    const students = await User.find({ role: 'student' });
    logger.info(`Found ${students.length} students`);

    // Get all wardens
    const wardens = await User.find({ role: 'warden' });
    logger.info(`Found ${wardens.length} wardens`);

    if (students.length === 0 || wardens.length === 0) {
      logger.error('No students or wardens found');
      process.exit(1);
    }

    const purposes = ['Home Visit', 'Medical', 'Family Function', 'Personal Work', 'Emergency'];
    const statuses = ['pending', 'approved', 'rejected', 'checked_out', 'checked_in'];
    
    const outpasses = [];
    
    // Create 5-10 outpasses per student
    for (const student of students) {
      const numOutpasses = Math.floor(Math.random() * 6) + 5; // 5-10 outpasses
      
      for (let i = 0; i < numOutpasses; i++) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
        
        const toDate = new Date(fromDate);
        toDate.setHours(toDate.getHours() + Math.floor(Math.random() * 48) + 4); // 4-52 hours
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const warden = wardens[Math.floor(Math.random() * wardens.length)];
        
        const outpass: any = {
          student: student._id,
          purpose: purposes[Math.floor(Math.random() * purposes.length)],
          destination: `Destination ${i + 1}`,
          fromDate,
          toDate,
          status,
          createdAt: fromDate,
        };
        
        if (status !== 'pending') {
          outpass.approvedBy = warden._id;
          outpass.approvedAt = new Date(fromDate.getTime() + 3600000); // 1 hour after creation
        }
        
        if (status === 'rejected') {
          outpass.rejectionReason = 'Sample rejection reason';
        }
        
        if (status === 'checked_out' || status === 'checked_in') {
          outpass.checkOutTime = new Date(fromDate.getTime() + 7200000); // 2 hours after creation
        }
        
        if (status === 'checked_in') {
          outpass.checkInTime = toDate;
        }
        
        outpasses.push(outpass);
      }
    }
    
    await Outpass.insertMany(outpasses);
    logger.info(`✅ Created ${outpasses.length} outpasses`);
    
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    logger.error('Error creating outpasses:', error);
    process.exit(1);
  }
};

createOutpasses();
