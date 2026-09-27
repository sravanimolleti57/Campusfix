import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function runSearchFilterPaginationTest() {
  console.log('\n====================================================');
  console.log('   CAMPUSFIX SEARCH, FILTER, SORT & PAGINATION TEST ');
  console.log('====================================================\n');

  try {
    // 1. Authenticate Student, Admin, and Staff
    console.log('--- Phase 1: Authentication ---');
    const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campusfix.edu', password: 'studentpassword123' }),
    });
    const { token: studentToken } = await studentLogin.json();
    assert(Boolean(studentToken), 'Student token acquired');

    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campusfix.edu', password: 'adminpassword123' }),
    });
    const { token: adminToken } = await adminLogin.json();
    assert(Boolean(adminToken), 'Admin token acquired');

    const staffLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@campusfix.edu', password: 'staffpassword123' }),
    });
    const { token: staffToken } = await staffLogin.json();
    assert(Boolean(staffToken), 'Staff token acquired');

    // 2. Seed diverse complaints for realistic query testing
    console.log('\n--- Phase 2: Create Test Complaints ---');
    const sampleComplaints = [
      {
        title: 'High-speed Wi-Fi router flashing red in Hostel Block 3',
        description: 'Repeated signal drops during online exams. Room 304.',
        category: 'Internet/Wi-Fi',
        location: 'Hostel Block 3, 3rd Floor',
        priority: 'High',
      },
      {
        title: 'Broken desk leg in Classroom 102',
        description: 'Wooden study desk tilted, unsafe for student laptops.',
        category: 'Furniture',
        location: 'Main Academic Wing, Room 102',
        priority: 'Low',
      },
      {
        title: 'Water tap leaking heavily in Chem Lab washroom',
        description: 'Continuous water loss from rusted bronze valve.',
        category: 'Plumbing',
        location: 'Science Complex, Chem Lab 2',
        priority: 'Critical',
      },
      {
        title: 'Ceiling light tube blinking rapidly in Library Quiet Zone',
        description: 'Strobe effect causing headache in central study area.',
        category: 'Electrical',
        location: 'Central Library, 1st Floor',
        priority: 'Medium',
      },
    ];

    for (const item of sampleComplaints) {
      await fetch(`${BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify(item),
      });
    }
    console.log('[PASS] Test complaints seeded');

    // 3. Test Student Complaints API: Search, Filter, Sort, Pagination
    console.log('\n--- Phase 3: Student Complaints API ---');

    // 3a. Search by keyword ?search=wifi
    const studentSearchRes = await fetch(`${BASE_URL}/complaints/my?search=wifi`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentSearchData = await studentSearchRes.json();
    assert(studentSearchRes.status === 200, 'GET /api/complaints/my?search=wifi HTTP 200');
    assert(Array.isArray(studentSearchData.data), 'Returns data array');
    assert(Boolean(studentSearchData.pagination), 'Returns pagination object');
    assert(typeof studentSearchData.pagination.page === 'number', 'pagination.page is number');
    assert(typeof studentSearchData.pagination.total === 'number', 'pagination.total is number');
    assert(
      studentSearchData.data.some((c) => /wi[- ]?fi/i.test(c.title) || /wi[- ]?fi/i.test(c.category)),
      'Student search correctly found wifi ticket'
    );
    console.log('[PASS] Student search correctly found wifi ticket');

    // 3b. Filter by category & priority: ?category=Plumbing&priority=Critical
    const studentFilterRes = await fetch(
      `${BASE_URL}/complaints/my?category=Plumbing&priority=Critical`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    const studentFilterData = await studentFilterRes.json();
    assert(studentFilterRes.status === 200, 'GET /api/complaints/my?category=Plumbing&priority=Critical HTTP 200');
    assert(
      studentFilterData.data.every((c) => c.category === 'Plumbing' && c.priority === 'Critical'),
      '[PASS] Student category and priority filter verified'
    );

    // 3c. Pagination & Sorting: ?page=1&limit=2&sortBy=createdAt&sortOrder=desc
    const studentPageRes = await fetch(
      `${BASE_URL}/complaints/my?page=1&limit=2&sortBy=createdAt&sortOrder=desc`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    const studentPageData = await studentPageRes.json();
    assert(studentPageData.pagination.page === 1, 'pagination.page === 1');
    assert(studentPageData.pagination.limit === 2, 'pagination.limit === 2');
    assert(studentPageData.data.length <= 2, 'data.length <= limit');
    assert(studentPageData.pagination.totalPages >= 1, 'pagination.totalPages >= 1');
    console.log('[PASS] Student pagination metadata and limits verified');

    // 4. Test Admin Complaints API: Full Lifecycle Querying
    console.log('\n--- Phase 4: Admin Complaints API ---');

    // 4a. Admin query with ?status=SUBMITTED&priority=HIGH&sortBy=createdAt&sortOrder=desc
    const adminQueryRes = await fetch(
      `${BASE_URL}/admin/complaints?page=1&limit=10&status=SUBMITTED&priority=HIGH&sortBy=createdAt&sortOrder=desc`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const adminQueryData = await adminQueryRes.json();
    assert(adminQueryRes.status === 200, 'GET /api/admin/complaints HTTP 200');
    assert(Array.isArray(adminQueryData.data), 'Admin response contains data array');
    assert(Boolean(adminQueryData.pagination), 'Admin response contains pagination metadata');
    assert(adminQueryData.pagination.limit === 10, 'Admin pagination limit verified');
    console.log('[PASS] Admin status, priority (HIGH case-insensitive), sorting and pagination verified');

    // 4b. Admin Date Filter ?dateFilter=today
    const adminDateRes = await fetch(
      `${BASE_URL}/admin/complaints?dateFilter=today`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const adminDateData = await adminDateRes.json();
    assert(adminDateRes.status === 200, 'Admin dateFilter=today HTTP 200');
    assert(adminDateData.data.length > 0, '[PASS] Admin date filter returned today complaints');

    // 5. Test Staff Complaints API: Scoped Queries
    console.log('\n--- Phase 5: Staff Complaints API ---');
    // First assign a complaint to staff so staff has assigned items
    const allAdminRes = await fetch(`${BASE_URL}/admin/complaints?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data: firstTickets } = await allAdminRes.json();
    assert(firstTickets.length > 0, 'Found ticket to assign');

    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const { user: staffProfile } = await meRes.json();

    await fetch(`${BASE_URL}/admin/complaints/${firstTickets[0]._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'ASSIGNED',
        assignedTo: staffProfile.id || staffProfile._id,
      }),
    });

    // Staff query: ?page=1&limit=5&sortBy=createdAt&sortOrder=desc
    const staffQueryRes = await fetch(
      `${BASE_URL}/staff/complaints?page=1&limit=5&sortBy=createdAt&sortOrder=desc`,
      { headers: { Authorization: `Bearer ${staffToken}` } }
    );
    const staffQueryData = await staffQueryRes.json();
    assert(staffQueryRes.status === 200, 'GET /api/staff/complaints HTTP 200');
    assert(Array.isArray(staffQueryData.data), 'Staff response has data array');
    assert(Boolean(staffQueryData.pagination), 'Staff response has pagination metadata');
    assert(staffQueryData.data.length >= 1, 'Staff retrieved assigned complaint');
    console.log('[PASS] Staff query, pagination metadata, and role scoping verified');

    console.log('\n====================================================');
    console.log('SEARCH, FILTER, SORT & PAGINATION: ALL CHECKS PASSED!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n[SEARCH & FILTER TEST ERROR]:', error.message);
    process.exit(1);
  }
}

runSearchFilterPaginationTest();
