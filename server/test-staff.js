import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import app from './server.js';
import http from 'http';

dotenv.config();

let mongoServer;
let server;
let baseUrl;

const makeRequest = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

const runStaffTests = async () => {
  console.log('\n====================================================');
  console.log('    CAMPUSFIX STAFF PORTAL SPECIFICATION TEST   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  };

  try {
    // 1. Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // 2. Start temporary HTTP server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // 3. Create users: Admin, Staff A, Staff B, Student
    const adminUser = await User.create({
      name: 'Campus Admin',
      email: 'admin@campusfix.edu',
      password: 'adminpassword123',
      phone: '9876543210',
      role: 'admin',
      department: 'Estate Office',
      employeeId: 'ADM-001',
    });

    const staffA = await User.create({
      name: 'Ramesh Electrician',
      email: 'staffA@campusfix.edu',
      password: 'staffpassword123',
      phone: '9876543211',
      role: 'staff',
      department: 'Electrical Maintenance',
      employeeId: 'STF-001',
    });

    const staffB = await User.create({
      name: 'Suresh Plumber',
      email: 'staffB@campusfix.edu',
      password: 'staffpassword123',
      phone: '9876543212',
      role: 'staff',
      department: 'Plumbing Works',
      employeeId: 'STF-002',
    });

    const studentUser = await User.create({
      name: 'Rahul Verma',
      email: 'student@campusfix.edu',
      password: 'studentpassword123',
      phone: '9876543213',
      role: 'student',
      department: 'Computer Science',
      studentId: 'CS2026-089',
    });

    // Login tokens
    const adminLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@campusfix.edu', password: 'adminpassword123' }),
    });
    const adminToken = adminLogin.data.token;

    const staffALogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'staffA@campusfix.edu', password: 'staffpassword123' }),
    });
    const staffAToken = staffALogin.data.token;

    const staffBLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'staffB@campusfix.edu', password: 'staffpassword123' }),
    });
    const staffBToken = staffBLogin.data.token;

    const studentLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@campusfix.edu', password: 'studentpassword123' }),
    });
    const studentToken = studentLogin.data.token;

    console.log('--- Phase 1: Staff Authorization & Role Isolation ---');
    // Staff cannot access admin APIs
    const staffAdminAccess = await makeRequest('/api/admin/stats', {
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    assert(staffAdminAccess.status === 403, 'Staff is blocked (HTTP 403) from accessing Admin API endpoints');

    const staffUsersAccess = await makeRequest('/api/admin/users', {
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    assert(staffUsersAccess.status === 403, 'Staff cannot view or modify users list via Admin endpoints');

    // Create 2 test complaints reported by Student
    const complaint1Res = await makeRequest('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        title: 'Ceiling Fan short-circuit in Room 301',
        description: 'Sparking noticed when turning on regulator switch.',
        category: 'Electrical',
        location: 'Academic Block A - Room 301',
        priority: 'High',
      }),
    });
    const complaint1 = complaint1Res.data.complaint;
    assert(complaint1Res.status === 201 && complaint1.complaintId, 'Student submitted Complaint 1');

    const complaint2Res = await makeRequest('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        title: 'Water pipe leak in 2nd floor restroom',
        description: 'Major water leakage from main flush pipeline.',
        category: 'Plumbing',
        location: 'Hostel Block C - 2nd Floor',
        priority: 'Medium',
      }),
    });
    const complaint2 = complaint2Res.data.complaint;
    assert(complaint2Res.status === 201 && complaint2.complaintId, 'Student submitted Complaint 2');

    // Admin assigns Complaint 1 to Staff A, Complaint 2 to Staff B
    await makeRequest(`/api/admin/complaints/${complaint1._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        assignedTo: staffA._id,
        status: 'ASSIGNED',
        adminNotes: 'Assigned to Ramesh. Please inspect today.',
      }),
    });

    await makeRequest(`/api/admin/complaints/${complaint2._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        assignedTo: staffB._id,
        status: 'ASSIGNED',
        adminNotes: 'Assigned to Suresh.',
      }),
    });

    console.log('\n--- Phase 2: Complaint Scoping (Staff ONLY sees assigned complaints) ---');
    // Staff A views complaint list
    const staffAComplaintsRes = await makeRequest('/api/staff/complaints', {
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    assert(staffAComplaintsRes.status === 200, 'Staff A fetched complaints list');
    assert(staffAComplaintsRes.data.complaints.length === 1, 'Staff A sees exactly 1 complaint (scoped to Staff A)');
    assert(
      staffAComplaintsRes.data.complaints[0]._id.toString() === complaint1._id.toString(),
      'Staff A sees Complaint 1 which was assigned to them'
    );

    // Staff A tries to view Complaint 2 (assigned to Staff B) -> MUST be 403 Forbidden!
    const staffAViewComplaint2 = await makeRequest(`/api/staff/complaints/${complaint2._id}`, {
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    assert(
      staffAViewComplaint2.status === 403,
      'Staff A is blocked (HTTP 403) from accessing Complaint 2 (assigned to Staff B)'
    );

    // Staff A tries to view Complaint 2 via general /api/complaints/:id -> MUST also be 403!
    const staffAViewComplaint2General = await makeRequest(`/api/complaints/${complaint2._id}`, {
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    assert(
      staffAViewComplaint2General.status === 403,
      'Staff A is blocked (HTTP 403) from accessing Complaint 2 via general API'
    );

    console.log('\n--- Phase 3: Staff Dashboard Real Metrics ---');
    const staffDashboardRes = await makeRequest('/api/staff/dashboard', {
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    assert(staffDashboardRes.status === 200, 'Staff dashboard metrics retrieved');
    assert(staffDashboardRes.data.stats.totalAssigned === 1, 'totalAssigned is 1');
    assert(staffDashboardRes.data.stats.pendingAssignments === 1, 'pendingAssignments is 1');
    assert(staffDashboardRes.data.stats.inProgress === 0, 'inProgress is 0');
    assert(staffDashboardRes.data.stats.resolved === 0, 'resolved is 0');
    assert(staffDashboardRes.data.stats.highPriority === 1, 'highPriority is 1 (Complaint 1 is High)');

    console.log('\n--- Phase 4: Status Transition Validation ---');
    // Rule: ASSIGNED -> RESOLVED is ILLEGAL without starting work (IN_PROGRESS) first!
    const illegalDirectResolve = await makeRequest(`/api/staff/complaints/${complaint1._id}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffAToken}` },
      body: JSON.stringify({ resolutionNotes: 'Trying to resolve without starting work' }),
    });
    assert(
      illegalDirectResolve.status === 400,
      'Prevented invalid status transition: Cannot transition directly from ASSIGNED to RESOLVED'
    );

    // Rule: Staff cannot transition to terminal student/admin statuses (VERIFIED, CLOSED)
    const illegalVerifiedTransition = await makeRequest(`/api/staff/complaints/${complaint1._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${staffAToken}` },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    assert(
      illegalVerifiedTransition.status === 400,
      'Prevented invalid status transition: Staff cannot mark ticket as VERIFIED'
    );

    // Valid transition 1: Accept assignment / Start work: ASSIGNED -> IN_PROGRESS
    const startWorkRes = await makeRequest(`/api/staff/complaints/${complaint1._id}/start-work`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffAToken}` },
      body: JSON.stringify({ notes: 'Arrived at Room 301 with replacement capacitor and multimeter.' }),
    });
    assert(startWorkRes.status === 200, 'Staff accepted assignment and started work (HTTP 200)');
    assert(startWorkRes.data.complaint.status === 'IN_PROGRESS', 'Complaint status transitioned to IN_PROGRESS');

    // Rule: Cannot call start-work again when already IN_PROGRESS
    const redundantStartWork = await makeRequest(`/api/staff/complaints/${complaint1._id}/start-work`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    assert(
      redundantStartWork.status === 400,
      'Prevented redundant start-work: Cannot start work on complaint already in IN_PROGRESS'
    );

    console.log('\n--- Phase 5: Progress Updates & Activity Logging ---');
    const progressRes = await makeRequest(`/api/staff/complaints/${complaint1._id}/progress`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffAToken}` },
      body: JSON.stringify({ notes: 'Capacitor replaced. Rewiring regulator switch.' }),
    });
    assert(progressRes.status === 200, 'Staff logged progress notes successfully');

    console.log('\n--- Phase 6: Resolution & Resolution Notes ---');
    // Resolution notes validation: Cannot resolve with empty notes
    const emptyNotesResolve = await makeRequest(`/api/staff/complaints/${complaint1._id}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffAToken}` },
      body: JSON.stringify({ resolutionNotes: '' }),
    });
    assert(emptyNotesResolve.status === 400, 'Validation enforced: Resolution notes cannot be empty');

    // Valid resolution: IN_PROGRESS -> RESOLVED
    const validResolve = await makeRequest(`/api/staff/complaints/${complaint1._id}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffAToken}` },
      body: JSON.stringify({
        resolutionNotes: 'Faulty capacitor replaced, regulator contacts cleaned and insulated. Fan speed calibrated.',
        resolutionImages: ['https://res.cloudinary.com/demo/image/upload/sample_repair_proof.jpg'],
      }),
    });
    assert(validResolve.status === 200, 'Complaint marked as RESOLVED by technician');
    assert(validResolve.data.complaint.status === 'RESOLVED', 'Complaint status updated to RESOLVED');
    assert(validResolve.data.complaint.resolvedAt !== null, 'resolvedAt timestamp recorded');

    console.log('\n--- Phase 7: Activity History Verification ---');
    const finalComplaintRes = await makeRequest(`/api/staff/complaints/${complaint1._id}`, {
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    const timeline = finalComplaintRes.data.complaint.activityLog;
    assert(timeline && timeline.length >= 4, `Activity log recorded ${timeline ? timeline.length : 0} events`);

    const actions = timeline.map((e) => e.action);
    assert(actions.includes('COMPLAINT_SUBMITTED'), 'Activity log includes COMPLAINT_SUBMITTED');
    assert(actions.includes('STAFF_ASSIGNED'), 'Activity log includes STAFF_ASSIGNED');
    assert(actions.includes('WORK_STARTED'), 'Activity log includes WORK_STARTED');
    assert(actions.includes('PROGRESS_UPDATE'), 'Activity log includes PROGRESS_UPDATE');
    assert(actions.includes('MARKED_RESOLVED'), 'Activity log includes MARKED_RESOLVED');

    console.log('\n--- Phase 8: Post-Resolution Dashboard Verification ---');
    const updatedDashboard = await makeRequest('/api/staff/dashboard', {
      headers: { Authorization: `Bearer ${staffAToken}` },
    });
    assert(updatedDashboard.data.stats.pendingAssignments === 0, 'pendingAssignments is now 0');
    assert(updatedDashboard.data.stats.inProgress === 0, 'inProgress is now 0');
    assert(updatedDashboard.data.stats.resolved === 1, 'resolved count updated to 1');

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('\n====================================================');
    console.log(`STAFF TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
};

runStaffTests();
