import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function runFeedbackVerificationTest() {
  console.log('\n====================================================');
  console.log('  CAMPUSFIX COMPLAINT VERIFICATION & FEEDBACK TEST  ');
  console.log('====================================================\n');

  try {
    // 1. Authenticate users: Student A (reporter), Student B (unauthorized), Staff, Admin
    console.log('--- Phase 1: Authentication & Setup ---');
    const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campusfix.edu', password: 'studentpassword123' }),
    });
    const { token: studentToken, user: studentUser } = await studentLogin.json();
    assert(Boolean(studentToken), 'Student A authenticated');

    const timestamp = Date.now();
    const studentBEmail = `student_b_${timestamp}@campusfix.edu`;
    const regBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imposter Student',
        email: studentBEmail,
        password: 'password123',
        department: 'Physics',
        studentId: `STU-B-${timestamp}`,
      }),
    });
    const { token: studentBToken } = await regBRes.json();
    assert(Boolean(studentBToken), 'Student B registered and authenticated');

    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campusfix.edu', password: 'adminpassword123' }),
    });
    const { token: adminToken } = await adminLogin.json();
    assert(Boolean(adminToken), 'Admin authenticated');

    const staffLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@campusfix.edu', password: 'staffpassword123' }),
    });
    const { token: staffToken, user: staffUser } = await staffLogin.json();
    assert(Boolean(staffToken), 'Staff authenticated');

    // 2. Create a test complaint by Student A
    console.log('\n--- Phase 2: Complaint Creation & Staff Resolution ---');
    const compRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Water tap leaking in Chemistry Lab 3',
        description: 'Continuous dripping causing floor water accumulation near reagent shelves.',
        category: 'Plumbing',
        location: 'Chemistry Block, Ground Floor, Lab 3',
        priority: 'High',
      }),
    });
    const compData = await compRes.json();
    assert(compData.success, 'Complaint created by Student A');
    const complaintId = compData.complaint._id;

    // Admin assigns staff
    await fetch(`${BASE_URL}/admin/complaints/${complaintId}`, {
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

    // Staff starts work
    await fetch(`${BASE_URL}/staff/complaints/${complaintId}/start-work`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ notes: 'Commencing pipe inspection and washer replacement' }),
    });

    // Staff marks complaint as RESOLVED
    const resolveRes = await fetch(`${BASE_URL}/staff/complaints/${complaintId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        resolutionNotes: 'Replaced rubber washer and tightened valve spindle. No leak observed.',
      }),
    });
    const resolveData = await resolveRes.json();
    assert(resolveData.complaint.status === 'RESOLVED', 'Complaint marked as RESOLVED by staff');

    // 3. Authorization & Validation Checks
    console.log('\n--- Phase 3: Authorization & Validation Security ---');
    // Student B attempts to verify Student A's complaint -> 403 Forbidden
    const unauthVerify = await fetch(`${BASE_URL}/complaints/${complaintId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentBToken}`,
      },
    });
    assert(unauthVerify.status === 403, '[PASS] Student B blocked with HTTP 403 from verifying Student A complaint');

    // Student B attempts to report problem still exists -> 403 Forbidden
    const unauthReopen = await fetch(`${BASE_URL}/complaints/${complaintId}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentBToken}`,
      },
      body: JSON.stringify({ reason: 'Hacking attempt' }),
    });
    assert(unauthReopen.status === 403, '[PASS] Student B blocked with HTTP 403 from reopening Student A complaint');

    // 4. Test "Problem Still Exists" (RESOLVED -> REOPENED)
    console.log('\n--- Phase 4: Action "Problem Still Exists" (RESOLVED -> REOPENED) ---');
    const reopenRes = await fetch(`${BASE_URL}/complaints/${complaintId}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        reason: 'Tap is still dripping slowly after main valve was turned on.',
      }),
    });
    const reopenData = await reopenRes.json();
    assert(reopenRes.status === 200, 'Reopen endpoint returned HTTP 200');
    assert(reopenData.complaint.status === 'REOPENED', '[PASS] Complaint status transitioned to REOPENED');

    // Check timeline has REOPENED event
    const reopenTimelineCheck = reopenData.timeline.some((t) => t.action === 'REOPENED');
    assert(reopenTimelineCheck, '[PASS] ActivityLog recorded REOPENED action');

    // Staff restarts work and resolves it again
    await fetch(`${BASE_URL}/staff/complaints/${complaintId}/start-work`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ notes: 'Fitted complete brass cartridge unit' }),
    });

    await fetch(`${BASE_URL}/staff/complaints/${complaintId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        resolutionNotes: 'Brand new ceramic cartridge installed. Fully sealed and pressure tested.',
      }),
    });

    // 5. Test "Confirm Resolution" (RESOLVED -> VERIFIED -> CLOSED)
    console.log('\n--- Phase 5: Action "Confirm Resolution" (RESOLVED -> VERIFIED -> CLOSED) ---');
    const verifyRes = await fetch(`${BASE_URL}/complaints/${complaintId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, 'Verify endpoint returned HTTP 200');
    assert(verifyData.complaint.status === 'CLOSED', '[PASS] Complaint status reached CLOSED');
    assert(Boolean(verifyData.complaint.closedAt), '[PASS] closedAt timestamp recorded');

    // Verify both VERIFIED and CLOSED events were recorded in timeline
    const hasVerifiedLog = verifyData.timeline.some((t) => t.action === 'VERIFIED');
    const hasClosedLog = verifyData.timeline.some((t) => t.action === 'CLOSED');
    assert(hasVerifiedLog, '[PASS] ActivityLog recorded VERIFIED transition');
    assert(hasClosedLog, '[PASS] ActivityLog recorded CLOSED transition');

    // 6. Test Feedback Submission on Verified/Closed Complaint
    console.log('\n--- Phase 6: Student Feedback Submission & Validation ---');
    // Test invalid rating: rating = 6
    const invalidRatingRes = await fetch(`${BASE_URL}/complaints/${complaintId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ rating: 6, comment: 'Super invalid rating' }),
    });
    assert(invalidRatingRes.status === 400, '[PASS] Rating > 5 rejected with HTTP 400');

    // Valid feedback: rating = 5, comment = 'Water tap is working perfectly now. Prompt service!'
    const feedbackRes = await fetch(`${BASE_URL}/complaints/${complaintId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Water tap is working perfectly now. Prompt service!',
      }),
    });
    const feedbackData = await feedbackRes.json();
    assert(feedbackRes.status === 201, 'Feedback endpoint returned HTTP 201 Created');
    assert(feedbackData.feedback.rating === 5, '[PASS] Feedback saved with rating: 5');
    assert(feedbackData.feedback.comment.includes('working perfectly'), '[PASS] Feedback saved with comment');
    assert(Boolean(feedbackData.feedback.submittedAt), '[PASS] Feedback submittedAt timestamp populated');

    // 7. Prevent Multiple Feedback Submissions for the Same Complaint
    console.log('\n--- Phase 7: Prevent Multiple Feedback Submissions ---');
    const duplicateFeedbackRes = await fetch(`${BASE_URL}/complaints/${complaintId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        rating: 4,
        comment: 'Attempting second review on same complaint',
      }),
    });
    assert(duplicateFeedbackRes.status === 400, '[PASS] Duplicate feedback rejected with HTTP 400');

    // 8. Admin View Feedback & Summary Analytics
    console.log('\n--- Phase 8: Admin View Feedback & Dashboard Statistics ---');
    // Admin gets all feedbacks
    const adminFeedbackRes = await fetch(`${BASE_URL}/admin/feedback`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminFeedbackData = await adminFeedbackRes.json();
    assert(adminFeedbackRes.status === 200, 'Admin feedback endpoint returned HTTP 200');
    assert(adminFeedbackData.totalFeedbacks >= 1, '[PASS] Admin retrieved feedback records from MongoDB');
    assert(adminFeedbackData.averageRating >= 1 && adminFeedbackData.averageRating <= 5, '[PASS] Admin calculated real average rating');
    assert(Boolean(adminFeedbackData.ratingDistribution), '[PASS] Admin retrieved rating distribution statistics');

    // Admin dashboard stats includes feedbackStats
    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStatsData = await adminStatsRes.json();
    assert(adminStatsRes.status === 200, 'Admin stats returned HTTP 200');
    assert(Boolean(adminStatsData.stats.feedbackStats), '[PASS] Admin dashboard contains real feedbackStats');
    assert(adminStatsData.stats.feedbackStats.totalFeedback >= 1, '[PASS] feedbackStats.totalFeedback populated');
    assert(adminStatsData.stats.feedbackStats.averageRating >= 1, '[PASS] feedbackStats.averageRating calculated');

    console.log('\n====================================================');
    console.log('VERIFICATION & FEEDBACK TEST: ALL 18 CHECKS PASSED! ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n[TEST ERROR]:', error.message);
    process.exit(1);
  }
}

runFeedbackVerificationTest();
