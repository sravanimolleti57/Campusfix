import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

// Load environment variables for standalone execution
dotenv.config();

const usersToSeed = [
  {
    name: 'Priya Sharma',
    email: 'student@campusfix.edu',
    password: 'studentpassword123',
    role: 'student',
    studentId: 'STU-2026-042',
    department: 'Computer Science & Engineering',
    phone: '+1 555-0102',
    isActive: true,
  },
  {
    name: 'Dave Maintenance',
    email: 'staff@campusfix.edu',
    password: 'staffpassword123',
    role: 'staff',
    employeeId: 'EMP-STF-014',
    department: 'Electrical Maintenance',
    phone: '+1 555-0101',
    isActive: true,
  },
  {
    name: 'Campus Administrator',
    email: 'admin@campusfix.edu',
    password: 'adminpassword123',
    role: 'admin',
    employeeId: 'EMP-ADM-001',
    department: 'Estate & Campus Operations',
    phone: '+1 555-0100',
    isActive: true,
  },
];

/**
 * Idempotent seed function to ensure Student, Staff, and Admin test accounts exist in MongoDB
 */
export const seedUsers = async () => {
  try {
    await connectDB();
    console.log('[CampusFix Seeder]: Checking production role accounts in MongoDB...');

    for (const userData of usersToSeed) {
      const existingUser = await User.findOne({ email: userData.email });

      if (!existingUser) {
        // User.create triggers Mongoose pre-save hook which securely hashes password using bcryptjs
        await User.create(userData);
        console.log(`[CampusFix Seeder]: Created account for role: ${userData.role} (${userData.email})`);
      } else {
        let needsSave = false;
        if (existingUser.role !== userData.role) {
          existingUser.role = userData.role;
          needsSave = true;
        }
        if (!existingUser.isActive) {
          existingUser.isActive = true;
          needsSave = true;
        }
        if (needsSave) {
          await existingUser.save();
          console.log(`[CampusFix Seeder]: Updated account details for role: ${userData.role} (${userData.email})`);
        } else {
          console.log(`[CampusFix Seeder]: Account exists and active for role: ${userData.role} (${userData.email})`);
        }
      }
    }

    console.log('[CampusFix Seeder]: Production user seeding check completed successfully.');
  } catch (error) {
    console.error('[CampusFix Seeder Error]: Failed to seed users:', error.message);
    throw error;
  }
};

// Execute automatically if invoked directly via CLI (e.g. node seedUsers.js)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('seedUsers.js') || 
  process.argv[1].endsWith('seedUsers')
);

if (isDirectRun) {
  seedUsers()
    .then(() => {
      console.log('[CampusFix Seeder]: Execution complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[CampusFix Seeder]: Aborted with error.');
      process.exit(1);
    });
}

export default seedUsers;
