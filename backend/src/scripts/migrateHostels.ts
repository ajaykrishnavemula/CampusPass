import 'dotenv/config';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Hostel } from '../models/Hostel';
import { logger } from '../utils/logger';

async function migrateHostels() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to database');

    // Get all unique hostel names from users
    const users = await User.find({ hostel: { $exists: true, $ne: '' } });
    const hostelNames = new Set<string>();

    users.forEach(user => {
      if (user.hostel) {
        hostelNames.add(user.hostel);
      }
    });

    logger.info(`Found ${hostelNames.size} unique hostels in user data`);

    // Create hostel documents for each unique hostel name
    for (const hostelName of hostelNames) {
      // Check if hostel already exists
      const existingHostel = await Hostel.findOne({ name: hostelName });
      
      if (!existingHostel) {
        // Generate code from name
        const code = hostelName
          .toUpperCase()
          .replace(/\s+/g, '_')
          .substring(0, 10);

        // Create hostel
        const hostel = new Hostel({
          name: hostelName,
          code: code,
          type: 'mixed', // Default type
          capacity: 100,
          currentOccupancy: 0,
          address: 'To be updated',
          contactNumber: '0000000000',
          facilities: [],
          isActive: true,
        });

        await hostel.save();
        logger.info(`Created hostel: ${hostelName}`);
      } else {
        logger.info(`Hostel already exists: ${hostelName}`);
      }
    }

    logger.info('✅ Hostel migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Hostel migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateHostels();

// 