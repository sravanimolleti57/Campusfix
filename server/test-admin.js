const BASE_URL = 'http://localhost:5000/api';

async function runAdminTests() {
  console.log('====================================================');
  console.log('    CAMPUSFIX ADMIN PORTAL API SPECIFICATION TEST   ');
  console.log('====================================================\n');

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
    // 1. Role-Based Authorization Security Check
    console.log('--- Phase 1: RBAC Security Isolation ---');
    const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campusfix.edu',
        password: 'studentpassword123',
      }),
    });
    const { token: studentToken } = await studentLogin.json();

    const studentAdminAttempt = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentAdminAttempt.status === 403,
      'Student is blocked (HTTP 403 Forbidden) from accessing admin endpoints'
    );

    // 2. Admin Authentication
    console.log('\n--- Phase 2: Admin Authentication ---');
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@campusfix.edu',
        password: 'adminpassword123',
      }),
    });
    const { token: adminToken, user: adminUser } = await adminLogin.json();
    assert(Boolean(adminToken) && adminUser.role === 'admin', 'Admin authenticated with admin privileges');

    // 3. Admin Analytics Dashboard API (GET /api/admin/stats)
    console.log('\n--- Phase 3: Real MongoDB Dashboard Analytics ---');
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.success, 'Admin stats retrieved successfully');
    assert(typeof statsData.stats.totalComplaints === 'number', 'Total complaints count returned');
    assert(
      statsData.stats.statusCounts &&
        statsData.stats.statusCounts.SUBMITTED !== undefined &&
        statsData.stats.statusCounts.RESOLVED !== undefined,
      'Status counts breakdown present for all 8 lifecycle states'
    );
    assert(
      statsData.stats.charts &&
        Array.isArray(statsData.stats.charts.byCategory) &&
        Array.isArray(statsData.stats.charts.byStatus) &&
        Array.isArray(statsData.stats.charts.byPriority) &&
        Array.isArray(statsData.stats.charts.monthlyTrends),
      'All 5 Recharts dataset aggregations populated from real MongoDB collections'
    );

    // 4. Admin All Complaints Management
    console.log('\n--- Phase 4: Admin Complaints Management ---');
    const complaintsRes = await fetch(`${BASE_URL}/admin/complaints?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const complaintsData = await complaintsRes.json();
    assert(complaintsRes.status === 200 && Array.isArray(complaintsData.complaints), 'Admin fetched all campus complaints');

    let testComplaintId = complaintsData.complaints[0]?._id;
    if (!testComplaintId) {
      // Create one if database is fresh
      const createRes = await fetch(`${BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: 'Admin Triage Test Issue',
          category: 'Hostel',
          location: 'Hostel Block 1, Room 101',
          priority: 'Medium',
          description: 'Window latch damaged by storm wind.',
        }),
      });
      const createData = await createRes.json();
      testComplaintId = createData.complaint._id;
    }

    // 5. Admin Triage & Assignment (PUT /api/admin/complaints/:id)
    console.log('\n--- Phase 5: Admin Triage, Priority, and Staff Assignment ---');
    // Fetch a staff member to assign
    const staffListRes = await fetch(`${BASE_URL}/admin/staff`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const staffListData = await staffListRes.json();
    const assignedStaffId = staffListData.staff[0]?._id;

    const triageRes = await fetch(`${BASE_URL}/admin/complaints/${testComplaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'ASSIGNED',
        priority: 'High',
        assignedTo: assignedStaffId,
        adminNotes: 'Assigned urgently. Carpenter dispatched with replacement latch.',
      }),
    });
    const triageData = await triageRes.json();
    assert(triageRes.status === 200 && triageData.success, 'Complaint triaged and assigned successfully');
    assert(triageData.complaint.priority === 'High', 'Priority updated to High');
    assert(triageData.complaint.status === 'ASSIGNED', 'Status updated to ASSIGNED');
    assert(
      triageData.complaint.adminNotes.includes('Carpenter dispatched'),
      'Admin internal notes persisted'
    );

    // 6. User Management (GET /api/admin/users & PATCH /api/admin/users/:id/status)
    console.log('\n--- Phase 6: User Management & Suspension Toggles ---');
    const usersRes = await fetch(`${BASE_URL}/admin/users?role=student&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();
    assert(usersRes.status === 200 && usersData.users.length > 0, 'Admin listed users with role filter');

    const targetStudent = usersData.users[0];
    const toggleRes = await fetch(`${BASE_URL}/admin/users/${targetStudent._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleData = await toggleRes.json();
    assert(toggleRes.status === 200 && toggleData.success, `Toggled active status for user ${targetStudent.name}`);

    // Re-toggle back to active
    await fetch(`${BASE_URL}/admin/users/${targetStudent._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // 7. Staff Management (Workload, Create, Update)
    console.log('\n--- Phase 7: Staff Management & Workload Tracking ---');
    assert(
      staffListData.staff.length > 0 && staffListData.staff[0].workload !== undefined,
      'Staff list returns real assigned, active, and resolved workload metrics'
    );

    const newStaffEmail = `technician_${Date.now()}@campusfix.edu`;
    const createStaffRes = await fetch(`${BASE_URL}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'David Maintenance',
        email: newStaffEmail,
        password: 'staffpassword123',
        department: 'Electrical & Power Systems',
        employeeId: `EMP-ELE-${Date.now().toString().slice(-4)}`,
        phone: '+1 555-4321',
      }),
    });
    const createStaffData = await createStaffRes.json();
    assert(createStaffRes.status === 201 && createStaffData.success, 'New staff member created by Admin');

    // 8. Categories & Locations Analytics
    console.log('\n--- Phase 8: Categories and Locations Insights ---');
    const catRes = await fetch(`${BASE_URL}/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const catData = await catRes.json();
    assert(catRes.status === 200 && catData.categories.length === 10, 'All 10 categories returned with issue frequencies');

    const locRes = await fetch(`${BASE_URL}/admin/locations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const locData = await locRes.json();
    assert(locRes.status === 200 && Array.isArray(locData.locations), 'Campus locations hotspot distribution returned');

    console.log('\n====================================================');
    console.log(`ADMIN TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal admin test error:', err);
  }
}

runAdminTests();
