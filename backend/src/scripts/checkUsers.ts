import 'dotenv/config';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';

async function checkUsers() {
  try {
    await connectDatabase();
    console.log('Connected to database\n');
    
    // Find one warden
    const warden = await User.findOne({ role: 2 }).select('name email hostel');
    console.log('=== WARDEN ===');
    console.log('Name:', warden?.name);
    console.log('Email:', warden?.email);
    console.log('Hostel:', warden?.hostel);
    console.log('Password: warden123\n');
    
    // Find one student in same hostel
    const student = await User.findOne({ role: 1, hostel: warden?.hostel }).select('name email hostel rollNumber');
    console.log('=== STUDENT (Same Hostel) ===');
    console.log('Name:', student?.name);
    console.log('Email:', student?.email);
    console.log('Roll Number:', student?.rollNumber);
    console.log('Hostel:', student?.hostel);
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();

// Made with Bob
