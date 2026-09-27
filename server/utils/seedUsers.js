import { seedUsers } from '../seedUsers.js';

/**
 * Re-export seedUsers for server startup initialization
 */
export const seedInitialUsers = async () => {
  try {
    await seedUsers();
  } catch (err) {
    console.warn('[CampusFix Seeder Warning]: Startup user seeding encountered an error:', err.message);
  }
};
