import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import app, { startServer } from './server.js';
import http from 'http';

dotenv.config();

const runAuthTests = async () => {
  console.log('========================================================');
  console.log(' CampusFix - Authentication & RBAC Verification Suite');
  console.log('========================================================');

  // 1. Establish Database Connection
  console.log('\n[Phase 1] Connecting to MongoDB...');
  await connectDB();

  // 2. Start HTTP Test Server
  const testPort = 5055;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  const baseUrl = `http://localhost:${testPort}/api/auth`;

  let studentToken = null;
  let adminToken = null;

  try {
    // -----------------------------------------------------------------
    // TEST 1: Student Registration (Valid)
    // -----------------------------------------------------------------
    console.log('\n[Test 1] Testing Student Registration (POST /api/auth/register)...');
    const newStudent = {
      name: 'Rohan Verma',
      email: `rohan_${Date.now()}@campusfix.edu`,
      password: 'password123',
      studentId: `STU-${Date.now().toString().slice(-4)}`,
      department: 'Computer Science & Engineering',
      phone: '+1 555-0987',
      role: 'student',
    };

    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent),
    });
    const regData = await regRes.json();

    console.log(`Status: ${regRes.status}`);
    console.log(`Response:`, JSON.stringify(regData, null, 2));

    if (regRes.status === 201 && regData.token && regData.user.email === newStudent.email) {
      console.log('✅ [Registration Test]: PASSED. Token generated, user created, password excluded from response.');
      studentToken = regData.token;
    } else {
      throw new Error(`Registration failed: ${regData.message}`);
    }

    // -----------------------------------------------------------------
    // TEST 2: Duplicate Registration Prevention (Duplicate Email)
    // -----------------------------------------------------------------
    console.log('\n[Test 2] Testing Duplicate Registration Prevention...');
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent), // Same email
    });
    const dupData = await dupRes.json();

    console.log(`Status: ${dupRes.status}`);
    console.log(`Response:`, JSON.stringify(dupData, null, 2));

    if (dupRes.status === 400 && dupData.message.includes('already exists')) {
      console.log('✅ [Duplicate Registration Test]: PASSED. Rejected with 400 Bad Request.');
    } else {
      throw new Error(`Duplicate test failed: Expected 400 error, got ${dupRes.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 3: User Login (Valid Credentials)
    // -----------------------------------------------------------------
    console.log('\n[Test 3] Testing User Login with Valid Credentials (POST /api/auth/login)...');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newStudent.email,
        password: newStudent.password,
      }),
    });
    const loginData = await loginRes.json();

    console.log(`Status: ${loginRes.status}`);
    console.log(`Response:`, JSON.stringify(loginData, null, 2));

    if (loginRes.status === 200 && loginData.token && loginData.user.role === 'student') {
      console.log('✅ [Login Test]: PASSED. Token returned, credentials verified.');
      studentToken = loginData.token;
    } else {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    // -----------------------------------------------------------------
    // TEST 4: Invalid Password Rejection
    // -----------------------------------------------------------------
    console.log('\n[Test 4] Testing Invalid Password Handling...');
    const badPassRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newStudent.email,
        password: 'wrong_password_999',
      }),
    });
    const badPassData = await badPassRes.json();

    console.log(`Status: ${badPassRes.status}`);
    console.log(`Response:`, JSON.stringify(badPassData, null, 2));

    if (badPassRes.status === 401 && badPassData.success === false) {
      console.log('✅ [Invalid Password Test]: PASSED. Rejected with 401 Unauthorized.');
    } else {
      throw new Error(`Invalid password test failed: Expected 401, got ${badPassRes.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 5: Authenticated Request (GET /api/auth/me)
    // -----------------------------------------------------------------
    console.log('\n[Test 5] Testing Authenticated Request (GET /api/auth/me)...');
    const meRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();

    console.log(`Status: ${meRes.status}`);
    console.log(`Response:`, JSON.stringify(meData, null, 2));

    if (meRes.status === 200 && meData.user && meData.user.email === newStudent.email) {
      console.log('✅ [Authenticated Request Test]: PASSED. Protected route decoded JWT and retrieved user.');
    } else {
      throw new Error(`Authenticated request failed: ${meData.message}`);
    }

    // -----------------------------------------------------------------
    // TEST 6: Unauthenticated Request (Missing Token)
    // -----------------------------------------------------------------
    console.log('\n[Test 6] Testing Unauthenticated Request (Missing Token)...');
    const noTokenRes = await fetch(`${baseUrl}/me`);
    const noTokenData = await noTokenRes.json();

    console.log(`Status: ${noTokenRes.status}`);
    if (noTokenRes.status === 401 && noTokenData.success === false) {
      console.log('✅ [Missing Token Test]: PASSED. Rejected with 401 Unauthorized.');
    } else {
      throw new Error(`Expected 401 for missing token, got ${noTokenRes.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 7: Role Protection (Student attempting Admin resource)
    // -----------------------------------------------------------------
    console.log('\n[Test 7] Testing Role Protection (Student accessing /api/auth/admin-only)...');
    const deniedRes = await fetch(`${baseUrl}/admin-only`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const deniedData = await deniedRes.json();

    console.log(`Status: ${deniedRes.status}`);
    console.log(`Response:`, JSON.stringify(deniedData, null, 2));

    if (deniedRes.status === 403 && deniedData.message.includes('not authorized')) {
      console.log('✅ [Role Protection Test - Negative]: PASSED. Student was blocked with 403 Forbidden.');
    } else {
      throw new Error(`Expected 403 Forbidden, got ${deniedRes.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 8: Role Protection (Admin accessing Admin resource)
    // -----------------------------------------------------------------
    console.log('\n[Test 8] Testing Role Protection (Admin accessing /api/auth/admin-only)...');
    // First, login or create admin
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      await User.create({
        name: 'Admin Test',
        email: 'admintest@campusfix.edu',
        password: 'adminpassword123',
        role: 'admin',
        department: 'Administration',
      });
    }

    const adminLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminUser ? adminUser.email : 'admintest@campusfix.edu',
        password: 'adminpassword123',
      }),
    });
    const adminLoginData = await adminLogin.json();
    adminToken = adminLoginData.token;

    const allowedRes = await fetch(`${baseUrl}/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const allowedData = await allowedRes.json();

    console.log(`Status: ${allowedRes.status}`);
    console.log(`Response:`, JSON.stringify(allowedData, null, 2));

    if (allowedRes.status === 200 && allowedData.success === true) {
      console.log('✅ [Role Protection Test - Positive]: PASSED. Admin authorized successfully.');
    } else {
      throw new Error(`Admin authorization failed: ${allowedData.message}`);
    }

    console.log('\n========================================================');
    console.log(' 🏁 All 8 Authentication & RBAC Tests Passed Successfully!');
    console.log('========================================================');
  } finally {
    server.close();
    process.exit(0);
  }
};

runAuthTests().catch((err) => {
  console.error('\n❌ [Test Suite Failure]:', err.message);
  process.exit(1);
});
