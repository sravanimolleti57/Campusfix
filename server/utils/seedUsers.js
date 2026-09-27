import User from '../models/User.js';

/**
 * Seeds initial demo accounts for all 3 roles if no users exist in the database
 */
export const seedInitialUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log('[CampusFix Seeder]: Database is empty. Creating initial role accounts...');

    // 1. Administrator Account
    await User.create({
      name: 'Campus Administrator',
      email: 'admin@campusfix.edu',
      password: 'adminpassword123',
      role: 'admin',
      employeeId: 'EMP-ADM-001',
      department: 'Estate & Campus Operations',
      phone: '+1 555-0100',
    });

    // 2. Maintenance Staff Account
    await User.create({
      name: 'Dave Maintenance',
      email: 'staff@campusfix.edu',
      password: 'staffpassword123',
      role: 'staff',
      employeeId: 'EMP-STF-014',
      department: 'Electrical Maintenance',
      phone: '+1 555-0101',
    });

    // 3. Demo Student Account
    await User.create({
      name: 'Priya Sharma',
      email: 'student@campusfix.edu',
      password: 'studentpassword123',
      role: 'student',
      studentId: 'STU-2026-042',
      department: 'Computer Science & Engineering',
      phone: '+1 555-0102',
    });

    console.log('[CampusFix Seeder]: Initial accounts created successfully for admin, staff, and student! 🌱');
  } catch (err) {
    console.warn('[CampusFix Seeder Warning]: Could not seed initial accounts:', err.message);
  }
};
