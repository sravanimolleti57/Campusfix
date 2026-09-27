import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import ActivityLog from './models/ActivityLog.js';
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

const runTimelineTests = async () => {
  console.log('\n====================================================');
  console.log('   CAMPUSFIX COMPLAINT ACTIVITY TIMELINE TEST   ');
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
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create 3 roles
    const admin = await User.create({
      name: 'Dr. Suresh Admin',
      email: 'admin@campusfix.edu',
      password: 'adminpassword123',
      role: 'admin',
      department: 'Estate Facilities',
    });

    const staff = await User.create({
      name: 'Ramesh Sharma',
      email: 'staff@campusfix.edu',
      password: 'staffpassword123',
      role: 'staff',
      department: 'Electrical Team',
      employeeId: 'STF-401',
    });

    const student = await User.create({
      name: 'Vamsi Krishna',
      email: 'vamsi@campusfix.edu',
      password: 'studentpassword123',
      role: 'student',
      department: 'Electronics',
      studentId: 'ECE-2026-042',
    });

    // Login tokens
    const adminLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@campusfix.edu', password: 'adminpassword123' }),
    });
    const adminToken = adminLogin.data.token;

    const staffLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'staff@campusfix.edu', password: 'staffpassword123' }),
    });
    const staffToken = staffLogin.data.token;

    const studentLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'vamsi@campusfix.edu', password: 'studentpassword123' }),
    });
    const studentToken = studentLogin.data.token;

    console.log('--- Action 1: Complaint Created ---');
    const createRes = await makeRequest('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        title: 'Corridor lights flickering',
        description: 'Fluorescent tubes blinking continuously in 3rd floor hallway.',
        category: 'Electrical',
        location: 'Engineering Block 1, Floor 3',
        priority: 'Low',
      }),
    });
    assert(createRes.status === 201, 'Student submitted complaint successfully');
    const complaint = createRes.data.complaint;

    // Check ActivityLog in database
    const log1 = await ActivityLog.findOne({ complaint: complaint._id, action: 'COMPLAINT_CREATED' });
    assert(log1 !== null, 'ActivityLog recorded COMPLAINT_CREATED event');
    assert(log1.newStatus === 'SUBMITTED', 'newStatus is SUBMITTED');
    assert(log1.message.includes('Vamsi'), 'ActivityLog message contains reporter name');

    console.log('\n--- Action 2: Complaint Reviewed by Admin ---');
    const reviewRes = await makeRequest(`/api/admin/complaints/${complaint._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'UNDER_REVIEW',
      }),
    });
    assert(reviewRes.status === 200, 'Admin placed complaint under review');

    const log2 = await ActivityLog.findOne({ complaint: complaint._id, action: 'COMPLAINT_REVIEWED' });
    assert(log2 !== null, 'ActivityLog recorded COMPLAINT_REVIEWED event');
    assert(log2.previousStatus === 'SUBMITTED', 'previousStatus was SUBMITTED');
    assert(log2.newStatus === 'UNDER_REVIEW', 'newStatus is UNDER_REVIEW');

    console.log('\n--- Action 3: Priority Changed ---');
    const prioRes = await makeRequest(`/api/admin/complaints/${complaint._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        priority: 'High',
      }),
    });
    assert(prioRes.status === 200, 'Admin escalated priority to High');

    const log3 = await ActivityLog.findOne({ complaint: complaint._id, action: 'PRIORITY_CHANGED' });
    assert(log3 !== null, 'ActivityLog recorded PRIORITY_CHANGED event');
    assert(log3.message.includes('High'), 'Message mentions High priority');

    console.log('\n--- Action 4: Staff Assigned ---');
    const assignRes = await makeRequest(`/api/admin/complaints/${complaint._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        assignedTo: staff._id,
      }),
    });
    assert(assignRes.status === 200, 'Admin assigned ticket to Ramesh Sharma');

    const log4 = await ActivityLog.findOne({ complaint: complaint._id, action: 'STAFF_ASSIGNED' });
    assert(log4 !== null, 'ActivityLog recorded STAFF_ASSIGNED event');
    assert(log4.newStatus === 'ASSIGNED', 'Status moved to ASSIGNED');
    assert(log4.message.includes('Ramesh Sharma'), 'Message mentions technician name');

    console.log('\n--- Actions 5 & 6: Assignment Accepted & Work Started ---');
    const startRes = await makeRequest(`/api/staff/complaints/${complaint._id}/start-work`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        notes: 'Arrived at Engineering Block with spare LED tubes.',
      }),
    });
    assert(startRes.status === 200, 'Technician accepted assignment and commenced work');

    const log5 = await ActivityLog.findOne({ complaint: complaint._id, action: 'ASSIGNMENT_ACCEPTED' });
    assert(log5 !== null, 'ActivityLog recorded ASSIGNMENT_ACCEPTED event');

    const log6 = await ActivityLog.findOne({ complaint: complaint._id, action: 'WORK_STARTED' });
    assert(log6 !== null, 'ActivityLog recorded WORK_STARTED event');
    assert(log6.newStatus === 'IN_PROGRESS', 'newStatus is IN_PROGRESS');

    console.log('\n--- Action 7: Progress Updated ---');
    const progRes = await makeRequest(`/api/staff/complaints/${complaint._id}/progress`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        notes: 'Choke replacement completed on tube 1 & 2. Testing tube 3 ballast.',
      }),
    });
    assert(progRes.status === 200, 'Technician logged progress update');

    const log7 = await ActivityLog.findOne({ complaint: complaint._id, action: 'PROGRESS_UPDATED' });
    assert(log7 !== null, 'ActivityLog recorded PROGRESS_UPDATED event');
    assert(log7.message.includes('Choke replacement'), 'Message captures progress note');

    console.log('\n--- Action 8: Resolved ---');
    const resolveRes = await makeRequest(`/api/staff/complaints/${complaint._id}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        resolutionNotes: 'All 3 tube fixtures replaced with new energy-saving LED strips. Lumens verified.',
      }),
    });
    assert(resolveRes.status === 200, 'Technician resolved complaint');

    const log8 = await ActivityLog.findOne({ complaint: complaint._id, action: 'RESOLVED' });
    assert(log8 !== null, 'ActivityLog recorded RESOLVED event');
    assert(log8.previousStatus === 'IN_PROGRESS', 'previousStatus is IN_PROGRESS');
    assert(log8.newStatus === 'RESOLVED', 'newStatus is RESOLVED');

    console.log('\n--- Action 9: Reopened (Testing student reopen flow) ---');
    const reopenRes = await makeRequest(`/api/complaints/${complaint._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        status: 'REOPENED',
        feedbackComment: 'Light #2 still flickering periodically after 10 minutes.',
      }),
    });
    assert(reopenRes.status === 200, 'Student reopened complaint ticket');

    const log9 = await ActivityLog.findOne({ complaint: complaint._id, action: 'REOPENED' });
    assert(log9 !== null, 'ActivityLog recorded REOPENED event');
    assert(log9.newStatus === 'REOPENED', 'newStatus is REOPENED');

    // Re-resolve so we can test Verified and Closed
    await makeRequest(`/api/staff/complaints/${complaint._id}/start-work`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    await makeRequest(`/api/staff/complaints/${complaint._id}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        resolutionNotes: 'Tightened neutral terminal in junction box. Flickering completely eradicated.',
      }),
    });

    console.log('\n--- Action 10: Verified by Student ---');
    const verifyRes = await makeRequest(`/api/complaints/${complaint._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        status: 'VERIFIED',
        feedbackRating: 5,
        feedbackComment: 'Tested for 1 hour. Perfectly working now. Thank you!',
      }),
    });
    assert(verifyRes.status === 200, 'Student verified resolution with 5 stars');

    const log10 = await ActivityLog.findOne({ complaint: complaint._id, action: 'VERIFIED' });
    assert(log10 !== null, 'ActivityLog recorded VERIFIED event');
    assert(log10.newStatus === 'VERIFIED', 'newStatus is VERIFIED');
    assert(log10.message.includes('5 stars'), 'Message contains rating info');

    console.log('\n--- Action 11: Closed by Admin ---');
    const closeRes = await makeRequest(`/api/admin/complaints/${complaint._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'CLOSED',
      }),
    });
    assert(closeRes.status === 200, 'Admin marked ticket as CLOSED');

    const log11 = await ActivityLog.findOne({ complaint: complaint._id, action: 'CLOSED' });
    assert(log11 !== null, 'ActivityLog recorded CLOSED event');
    assert(log11.newStatus === 'CLOSED', 'newStatus is CLOSED');

    console.log('\n--- Verification of API GET /api/complaints/:id/timeline ---');
    const timelineRes = await makeRequest(`/api/complaints/${complaint._id}/timeline`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(timelineRes.status === 200, 'Timeline endpoint returned HTTP 200');
    assert(timelineRes.data.timeline.length >= 10, `Retrieved ${timelineRes.data.timeline.length} timeline events`);

    const actions = timelineRes.data.timeline.map((t) => t.action);
    assert(actions.includes('COMPLAINT_CREATED'), 'Timeline includes COMPLAINT_CREATED');
    assert(actions.includes('COMPLAINT_REVIEWED'), 'Timeline includes COMPLAINT_REVIEWED');
    assert(actions.includes('PRIORITY_CHANGED'), 'Timeline includes PRIORITY_CHANGED');
    assert(actions.includes('STAFF_ASSIGNED'), 'Timeline includes STAFF_ASSIGNED');
    assert(actions.includes('ASSIGNMENT_ACCEPTED'), 'Timeline includes ASSIGNMENT_ACCEPTED');
    assert(actions.includes('WORK_STARTED'), 'Timeline includes WORK_STARTED');
    assert(actions.includes('PROGRESS_UPDATED'), 'Timeline includes PROGRESS_UPDATED');
    assert(actions.includes('RESOLVED'), 'Timeline includes RESOLVED');
    assert(actions.includes('REOPENED'), 'Timeline includes REOPENED');
    assert(actions.includes('VERIFIED'), 'Timeline includes VERIFIED');
    assert(actions.includes('CLOSED'), 'Timeline includes CLOSED');

  } catch (err) {
    console.error('Test execution error:', err);
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
    console.log(`TIMELINE TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
};

runTimelineTests();
