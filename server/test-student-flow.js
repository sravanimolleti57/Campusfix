const BASE_URL = 'http://localhost:5000/api';

async function testCompleteStudentFlow() {
  console.log('========================================================');
  console.log('  CAMPUSFIX STUDENT END-TO-END WORKFLOW INTEGRATION TEST ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} - ${details}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate student
    console.log('1. Authenticating student...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campusfix.edu',
        password: 'studentpassword123',
      }),
    });
    const { token: studentToken, user: studentUser } = await loginRes.json();
    assert(Boolean(studentToken), 'Student authenticated successfully');

    // 2. Submit Complaint #1: Electrical
    console.log('\n2. Submitting Electrical complaint...');
    const c1Res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Corridor Light Flickering Outside Lab 301',
        description: 'Fluorescent tube blinks continuously and causes eye strain in the evening.',
        category: 'Electrical',
        location: 'Engineering Block A, 3rd Floor',
        priority: 'Low',
      }),
    });
    const c1Data = await c1Res.json();
    assert(c1Data.success && c1Data.complaint?.complaintId, `Complaint 1 created: ${c1Data.complaint?.complaintId}`);
    const c1Id = c1Data.complaint._id;

    // 3. Submit Complaint #2: Wi-Fi
    console.log('\n3. Submitting Wi-Fi complaint...');
    const c2Res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Library 2nd Floor Wi-Fi AP Dropping Connections',
        description: 'Students in study carrels cannot load institutional portal.',
        category: 'Internet/Wi-Fi',
        location: 'Central Library, 2nd Floor East',
        priority: 'High',
      }),
    });
    const c2Data = await c2Res.json();
    assert(c2Data.success && c2Data.complaint?.complaintId, `Complaint 2 created: ${c2Data.complaint?.complaintId}`);

    // 4. Test Multi-criteria filtering
    console.log('\n4. Testing multi-criteria filtering...');
    const filterRes = await fetch(`${BASE_URL}/complaints/my?category=Internet/Wi-Fi&priority=High`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const filterData = await filterRes.json();
    assert(
      filterData.complaints.every((c) => c.category === 'Internet/Wi-Fi' && c.priority === 'High'),
      'Combined category and priority filter accurately matches tickets'
    );

    // 5. Test Resolution & Student Verification Flow
    console.log('\n5. Testing Resolution & Student Verification Flow...');
    // Login as staff and admin to set up assigned complaint
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff@campusfix.edu',
        password: 'staffpassword123',
      }),
    });
    const { token: staffToken, user: staffUser } = await staffLoginRes.json();

    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@campusfix.edu',
        password: 'adminpassword123',
      }),
    });
    const { token: adminToken } = await adminLoginRes.json();

    // Admin assigns c1Id to staff
    await fetch(`${BASE_URL}/admin/complaints/${c1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'ASSIGNED',
        assignedTo: staffUser.id || staffUser._id,
      }),
    });

    // Staff transitions from ASSIGNED -> IN_PROGRESS
    await fetch(`${BASE_URL}/staff/complaints/${c1Id}/start-work`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ notes: 'Starting inspection and repair' }),
    });

    // Staff marks c1 as RESOLVED
    const resolveRes = await fetch(`${BASE_URL}/staff/complaints/${c1Id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        resolutionNotes: 'Replaced ballast and fitted new energy-saving LED tube.',
      }),
    });
    const resolveData = await resolveRes.json();
    assert(resolveData.complaint?.status === 'RESOLVED', 'Staff resolved complaint ticket');
    assert(Boolean(resolveData.complaint?.resolvedAt), 'resolvedAt timestamp recorded');

    // Student verifies resolution with 5 stars
    const verifyRes = await fetch(`${BASE_URL}/complaints/${c1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
        feedbackRating: 5,
        feedbackComment: 'Light is working perfectly and does not flicker now. Thank you!',
      }),
    });
    const verifyData = await verifyRes.json();
    assert(verifyData.complaint?.status === 'VERIFIED', 'Student marked ticket as VERIFIED');
    assert(verifyData.complaint?.studentFeedback?.rating === 5, '5-Star rating recorded');
    assert(Boolean(verifyData.complaint?.closedAt), 'closedAt timestamp recorded upon verification');

    // 6. Test Pagination
    console.log('\n6. Testing pagination limit & pages...');
    const pageRes = await fetch(`${BASE_URL}/complaints/my?limit=1&page=1`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const pageData = await pageRes.json();
    assert(pageData.complaints.length === 1, 'Pagination limit=1 returns exactly 1 item');
    assert(pageData.totalPages >= 2, `Total pages calculated correctly: ${pageData.totalPages}`);

    console.log('\n========================================================');
    console.log(`WORKFLOW TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('Fatal workflow test error:', err);
  }
}

testCompleteStudentFlow();
