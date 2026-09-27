const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('   CAMPUSFIX STUDENT COMPLAINT SYSTEM TEST SUITE    ');
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
    // 1. Authenticate primary student
    console.log('--- Phase 1: Authenticate Student ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campusfix.edu',
        password: 'studentpassword123',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginData.success && loginData.token, 'Student login succeeded with JWT token');
    const studentToken = loginData.token;
    const studentId = loginData.user._id;

    // 2. Submit a new complaint
    console.log('\n--- Phase 2: Submit Complaint ---');
    const complaintPayload = {
      title: 'Water Leakage in 3rd Floor Restroom',
      description: 'The sink pipe under basin #2 is cracked and leaking water across the floor creating a slip hazard.',
      category: 'Plumbing',
      location: 'Science Block B, 3rd Floor Restroom',
      priority: 'High',
      images: ['/uploads/complaints/demo-leak.jpg'],
    };

    const createRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify(complaintPayload),
    });
    const createData = await createRes.json();
    assert(createData.success && createData.complaint, 'Complaint created successfully');
    assert(
      /^CF-\d{4}-\d{4}$/.test(createData.complaint?.complaintId),
      `Generated readable unique Complaint ID: ${createData.complaint?.complaintId}`
    );
    assert(createData.complaint?.status === 'SUBMITTED', 'Initial complaint status is SUBMITTED');
    assert(createData.complaint?.reportedBy?.email === 'student@campusfix.edu', 'Complaint correctly associated with student');

    const createdComplaintId = createData.complaint?._id;
    const readableId = createData.complaint?.complaintId;

    // 3. Submit a second complaint to test list, search, filter, and sequence numbering
    console.log('\n--- Phase 3: Submit 2nd Complaint for Sequence & Filters ---');
    const secondRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Projector Bulb Dead in Lecture Hall A',
        description: 'HDMI projector does not turn on. Lamp LED blinks red repeatedly.',
        category: 'Classroom',
        location: 'Academic Complex, Lecture Hall A',
        priority: 'Medium',
      }),
    });
    const secondData = await secondRes.json();
    assert(
      secondData.complaint?.complaintId !== readableId,
      `Second complaint generated unique sequence ID: ${secondData.complaint?.complaintId}`
    );

    // 4. Retrieve student's complaints with filters
    console.log('\n--- Phase 4: Retrieve Student Complaints (GET /api/complaints/my) ---');
    const listRes = await fetch(`${BASE_URL}/complaints/my`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listData = await listRes.json();
    assert(listData.success && listData.complaints.length >= 2, `Retrieved ${listData.complaints?.length} complaints for student`);
    assert(listData.stats?.total >= 2, `Aggregated dashboard stats: total=${listData.stats?.total}, submitted=${listData.stats?.submitted}`);

    // Search query test
    const searchRes = await fetch(`${BASE_URL}/complaints/my?search=Projector`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const searchData = await searchRes.json();
    assert(
      searchData.complaints.some((c) => c.title.includes('Projector')),
      'Search query filter correctly matches complaint title'
    );

    // Category filter test
    const catRes = await fetch(`${BASE_URL}/complaints/my?category=Plumbing`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const catData = await catRes.json();
    assert(
      catData.complaints.every((c) => c.category === 'Plumbing'),
      'Category filter matches only Plumbing complaints'
    );

    // 5. Get complaint by ID
    console.log('\n--- Phase 5: Get Complaint by ID ---');
    const getRes = await fetch(`${BASE_URL}/complaints/${readableId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getData = await getRes.json();
    assert(getData.success && getData.complaint?.complaintId === readableId, `Retrieved complaint by readable ID ${readableId}`);

    // 6. Security Check: Second student should NOT access primary student's complaint
    console.log('\n--- Phase 6: Student Authorization & Isolation ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: `student2_${Date.now()}@campusfix.edu`,
        password: 'password123',
        studentId: `STU-SEC-${Date.now().toString().slice(-4)}`,
        department: 'Biotechnology',
      }),
    });
    const regData = await regRes.json();
    const otherToken = regData.token;

    const unauthorizedRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert(unauthorizedRes.status === 403, 'Another student is strictly blocked (HTTP 403) from accessing complaints they did not report');

    // 7. Update complaint details
    console.log('\n--- Phase 7: Update Complaint Details ---');
    const updateRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Water Leakage in 3rd Floor Restroom (Urgent Update)',
        priority: 'Critical',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateData.success && updateData.complaint?.priority === 'Critical',
      'Complaint details updated successfully (priority changed to Critical)'
    );

    // 8. Delete allowed complaint
    console.log('\n--- Phase 8: Delete Complaint (where allowed in SUBMITTED state) ---');
    const deleteRes = await fetch(`${BASE_URL}/complaints/${secondData.complaint?._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const deleteData = await deleteRes.json();
    assert(deleteData.success, `Complaint ${secondData.complaint?.complaintId} deleted successfully`);

    // Verify deletion
    const verifyDelRes = await fetch(`${BASE_URL}/complaints/${secondData.complaint?._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(verifyDelRes.status === 404, 'Deleted complaint returns 404 on subsequent lookup');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
