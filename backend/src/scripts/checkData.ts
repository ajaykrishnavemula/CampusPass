import 'dotenv/config';
import { connectDatabase } from '../config/database';
import { Hostel } from '../models/Hostel';
import { User } from '../models/User';
import { Outpass } from '../models/Outpass';
import { logger } from '../utils/logger';

async function checkData() {
  try {
    await connectDatabase();
    
    console.log('\n=== HOSTELS IN DATABASE ===');
    const hostels = await Hostel.find({}).select('name code type');
    console.log(JSON.stringify(hostels, null, 2));
    
    console.log('\n=== STUDENTS WITH HOSTELS (First 10) ===');
    const students = await User.find({ role: 1 }).select('name hostel').limit(10);
    console.log(JSON.stringify(students, null, 2));
    
    console.log('\n=== OUTPASS COUNT ===');
    const outpassCount = await Outpass.countDocuments();
    console.log('Total outpasses:', outpassCount);
    
    if (outpassCount > 0) {
      console.log('\n=== SAMPLE OUTPASS WITH STUDENT ===');
      const sampleOutpass = await Outpass.findOne().populate('student', 'name hostel');
      console.log(JSON.stringify(sampleOutpass, null, 2));
      
      console.log('\n=== HOSTEL NAME MISMATCH CHECK ===');
      const hostelNames = hostels.map(h => h.name);
      const studentHostels = await User.distinct('hostel', { role: 1 });
      console.log('Hostel collection names:', hostelNames);
      console.log('Student hostel values:', studentHostels);
      console.log('Mismatches:', studentHostels.filter(sh => !hostelNames.includes(sh)));
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Check data error:', error);
    process.exit(1);
  }
}

checkData();

// 
