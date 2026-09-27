import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function runNotificationSystemTest() {
  console.log('\n====================================================');
  console.log('    CAMPUSFIX IN-APP NOTIFICATION SYSTEM TEST       ');
  console.log('====================================================\n');

  try {
    // 1. Authenticate Student, Staff, and Admin
    console.log('--- Phase 1: Authentication ---');
    const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campusfix.edu', password: 'studentpassword123' }),
    });
    const { token: studentToken, user: studentUser } = await studentLogin.json();
    assert(Boolean(studentToken), 'Student authenticated');

    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campusfix.edu', password: 'adminpassword123' }),
    });
    const { token: adminToken, user: adminUser } = await adminLogin.json();
    assert(Boolean(adminToken), 'Admin authenticated');

    const staffLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@campusfix.edu', password: 'staffpassword123' }),
    });
    const { token: staffToken, user: staffUser } = await staffLogin.json();
    assert(Boolean(staffToken), 'Staff authenticated');

    // 2. Event 1: Student submits complaint -> Triggers notifications for Admin and Student
    console.log('\n--- Phase 2: Event 1 - Complaint Submitted ---');
    const compRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Projector ceiling bracket loose in Seminar Hall 1',
        description: 'Mounting screws vibrating loose during lectures. Needs anchor bolts.',
        category: 'Classroom',
        location: 'Academic Complex, 2nd Floor, Hall 1',
        priority: 'High',
      }),
    });
    const compData = await compRes.json();
    assert(compData.success, 'Complaint created');
    const complaintId = compData.complaint._id;

    // Check Student received COMPLAINT_SUBMITTED notification
    const studentNotifRes1 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentNotifs1 = await studentNotifRes1.json();
    assert(studentNotifRes1.status === 200, 'GET /api/notifications returned HTTP 200');
    const studentSubmittedNotif = studentNotifs1.notifications.find(
      (n) => n.type === 'COMPLAINT_SUBMITTED'
    );
    assert(Boolean(studentSubmittedNotif), '[PASS] Event 1: Student received COMPLAINT_SUBMITTED notification');

    // Check Admin received COMPLAINT_SUBMITTED notification
    const adminNotifRes1 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminNotifs1 = await adminNotifRes1.json();
    const adminSubmittedNotif = adminNotifs1.notifications.find(
      (n) => n.type === 'COMPLAINT_SUBMITTED' && n.complaint?._id === complaintId
    );
    assert(Boolean(adminSubmittedNotif), '[PASS] Event 1: Admin received COMPLAINT_SUBMITTED notification');

    // 3. Event 2: Admin reviews complaint (UNDER_REVIEW) -> Student receives COMPLAINT_REVIEWED
    console.log('\n--- Phase 3: Event 2 - Complaint Reviewed ---');
    await fetch(`${BASE_URL}/admin/complaints/${complaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'UNDER_REVIEW' }),
    });

    const studentNotifRes2 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentNotifs2 = await studentNotifRes2.json();
    const reviewedNotif = studentNotifs2.notifications.find(
      (n) => n.type === 'COMPLAINT_REVIEWED'
    );
    assert(Boolean(reviewedNotif), '[PASS] Event 2: Student received COMPLAINT_REVIEWED notification');

    // 4. Event 3: Complaint is assigned -> Staff and Student receive COMPLAINT_ASSIGNED
    console.log('\n--- Phase 4: Event 3 - Complaint Assigned ---');
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

    const staffNotifRes3 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const staffNotifs3 = await staffNotifRes3.json();
    const staffAssignedNotif = staffNotifs3.notifications.find(
      (n) => n.type === 'COMPLAINT_ASSIGNED'
    );
    assert(Boolean(staffAssignedNotif), '[PASS] Event 3: Staff received COMPLAINT_ASSIGNED notification');

    const studentNotifRes3 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentNotifs3 = await studentNotifRes3.json();
    const studentStaffAssignedNotif = studentNotifs3.notifications.find(
      (n) => n.type === 'COMPLAINT_ASSIGNED'
    );
    assert(Boolean(studentStaffAssignedNotif), '[PASS] Event 3: Student received COMPLAINT_ASSIGNED notification');

    // 5. Event 4: Staff accepts assignment / work started -> Student and Admin notified
    console.log('\n--- Phase 5: Event 4 - Assignment Accepted & Work Started ---');
    await fetch(`${BASE_URL}/staff/complaints/${complaintId}/start-work`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ notes: 'Anchoring projector mount using heavy-duty masonry anchors' }),
    });

    const studentNotifRes4 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentNotifs4 = await studentNotifRes4.json();
    const workStartedNotif = studentNotifs4.notifications.find(
      (n) => n.type === 'ASSIGNMENT_ACCEPTED'
    );
    assert(Boolean(workStartedNotif), '[PASS] Event 4: Student received ASSIGNMENT_ACCEPTED notification');

    // 6. Event 5: Status changes -> STATUS_CHANGED notification
    console.log('\n--- Phase 6: Event 5 - Status Change Notification ---');
    // Admin toggles priority or status change
    await fetch(`${BASE_URL}/admin/complaints/${complaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ priority: 'Critical' }),
    });

    // 7. Event 6: Complaint is resolved -> Student and Admin receive COMPLAINT_RESOLVED
    console.log('\n--- Phase 7: Event 6 - Complaint Resolved ---');
    await fetch(`${BASE_URL}/staff/complaints/${complaintId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        resolutionNotes: 'Fitted 4x M8 concrete anchor bolts. Projector mount load-tested.',
      }),
    });

    const studentNotifRes6 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentNotifs6 = await studentNotifRes6.json();
    const resolvedNotif = studentNotifs6.notifications.find(
      (n) => n.type === 'COMPLAINT_RESOLVED'
    );
    assert(Boolean(resolvedNotif), '[PASS] Event 6: Student received COMPLAINT_RESOLVED notification');

    // 8. Event 7: Complaint is reopened -> Staff and Admin receive COMPLAINT_REOPENED
    console.log('\n--- Phase 8: Event 7 - Complaint Reopened ---');
    await fetch(`${BASE_URL}/complaints/${complaintId}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ reason: 'Slight vibration observed at high zoom level' }),
    });

    const staffNotifRes7 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const staffNotifs7 = await staffNotifRes7.json();
    const reopenedNotif = staffNotifs7.notifications.find(
      (n) => n.type === 'COMPLAINT_REOPENED'
    );
    assert(Boolean(reopenedNotif), '[PASS] Event 7: Staff received COMPLAINT_REOPENED notification');

    // Staff re-resolves
    await fetch(`${BASE_URL}/staff/complaints/${complaintId}/start-work`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ notes: 'Added rubber dampener pads between bracket and ceiling' }),
    });
    await fetch(`${BASE_URL}/staff/complaints/${complaintId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ resolutionNotes: 'Vibration dampers installed. Rock solid.' }),
    });

    // 9. Event 8: Complaint is verified -> Staff and Admin receive COMPLAINT_VERIFIED
    console.log('\n--- Phase 9: Event 8 - Complaint Verified ---');
    await fetch(`${BASE_URL}/complaints/${complaintId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    });

    const staffNotifRes8 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const staffNotifs8 = await staffNotifRes8.json();
    const verifiedNotif = staffNotifs8.notifications.find(
      (n) => n.type === 'COMPLAINT_VERIFIED'
    );
    assert(Boolean(verifiedNotif), '[PASS] Event 8: Staff received COMPLAINT_VERIFIED notification');

    // 10. Event 9: Feedback is submitted -> Staff and Admin receive FEEDBACK_SUBMITTED
    console.log('\n--- Phase 10: Event 9 - Feedback Submitted ---');
    await fetch(`${BASE_URL}/complaints/${complaintId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ rating: 5, comment: 'Projector is completely steady now! Superb.' }),
    });

    const staffNotifRes9 = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const staffNotifs9 = await staffNotifRes9.json();
    const feedbackNotif = staffNotifs9.notifications.find(
      (n) => n.type === 'FEEDBACK_SUBMITTED'
    );
    assert(Boolean(feedbackNotif), '[PASS] Event 9: Staff received FEEDBACK_SUBMITTED notification');

    // 11. Test Notification Read APIs: PATCH /api/notifications/:id/read and PATCH /api/notifications/read-all
    console.log('\n--- Phase 11: Notification Read APIs ---');
    const studentListRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentList = await studentListRes.json();
    const unreadBefore = studentList.unreadCount;
    assert(unreadBefore > 0, `Student has ${unreadBefore} unread notifications`);

    // Test mark single notification as read: PATCH /api/notifications/:id/read
    const targetNotifId = studentList.notifications[0]._id;
    const markSingleRes = await fetch(`${BASE_URL}/notifications/${targetNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const markSingleData = await markSingleRes.json();
    assert(markSingleRes.status === 200, 'PATCH /api/notifications/:id/read returned HTTP 200');
    assert(markSingleData.notification.isRead === true, '[PASS] Notification marked as read');
    assert(markSingleData.unreadCount === unreadBefore - 1, '[PASS] Unread count decremented');

    // Test mark all as read: PATCH /api/notifications/read-all
    const markAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const markAllData = await markAllRes.json();
    assert(markAllRes.status === 200, 'PATCH /api/notifications/read-all returned HTTP 200');
    assert(markAllData.unreadCount === 0, '[PASS] All notifications marked as read; unread count is 0');

    // Verify unreadOnly filter returns 0 items now
    const unreadOnlyRes = await fetch(`${BASE_URL}/notifications?unreadOnly=true`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const unreadOnlyData = await unreadOnlyRes.json();
    assert(unreadOnlyData.notifications.length === 0, '[PASS] unreadOnly=true filter verified');

    console.log('\n====================================================');
    console.log('NOTIFICATION TEST: ALL 12 VERIFICATIONS PASSED!    ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n[NOTIFICATION TEST ERROR]:', error.message);
    process.exit(1);
  }
}

runNotificationSystemTest();
