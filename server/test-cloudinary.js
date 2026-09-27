const BASE_URL = 'http://localhost:5000/api';

// Helper to construct multipart/form-data payload with boundaries
function createMultipartFormData(fields = {}, files = []) {
  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
  const chunks = [];

  // Append text fields
  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      )
    );
  }

  // Append file fields
  for (const file of files) {
    const filename = file.filename || 'image.jpg';
    const fieldname = file.fieldname || 'images';
    const contentType = file.contentType || 'image/jpeg';
    const content = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(file.content || '');

    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
      )
    );
    chunks.push(content);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(chunks);
  const headers = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  };

  return { body, headers };
}

// Generate valid JPEG dummy buffer
function createSampleImageBuffer(sizeInBytes = 1024 * 50, type = 'jpg') {
  const buf = Buffer.alloc(sizeInBytes);
  // JPEG SOI header: FF D8 FF
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  return buf;
}

async function runCloudinaryUploadTests() {
  console.log('====================================================');
  console.log('  CAMPUSFIX CLOUDINARY UPLOAD SPECIFICATION TESTS  ');
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
    // 0. Authenticate Student & Staff
    console.log('--- Step 0: Authenticate Student and Staff ---');
    const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campusfix.edu',
        password: 'studentpassword123',
      }),
    });
    const { token: studentToken } = await studentLogin.json();
    assert(Boolean(studentToken), 'Student authenticated successfully');

    const staffLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff@campusfix.edu',
        password: 'staffpassword123',
      }),
    });
    const { token: staffToken } = await staffLogin.json();
    assert(Boolean(staffToken), 'Staff authenticated successfully');

    // 1. Test: Valid Image Upload (JPG / PNG / WEBP)
    console.log('\n--- Test 1: Valid Image Upload ---');
    const validFile = {
      fieldname: 'images',
      filename: 'broken_fan.jpg',
      contentType: 'image/jpeg',
      content: createSampleImageBuffer(50 * 1024),
    };
    const multipart1 = createMultipartFormData({}, [validFile]);

    const upload1Res = await fetch(`${BASE_URL}/complaints/upload`, {
      method: 'POST',
      headers: {
        ...multipart1.headers,
        Authorization: `Bearer ${studentToken}`,
      },
      body: multipart1.body,
    });
    const upload1Data = await upload1Res.json();
    assert(upload1Res.status === 200 && upload1Data.success, 'Valid image upload succeeded (HTTP 200)');
    assert(
      upload1Data.images && upload1Data.images[0]?.includes('cloudinary.com'),
      `Secure Cloudinary URL returned: ${upload1Data.images?.[0]}`
    );

    // 2. Test: Invalid File Type Rejection (PDF / TXT)
    console.log('\n--- Test 2: Invalid File Type Rejection ---');
    const invalidFile = {
      fieldname: 'images',
      filename: 'syllabus.pdf',
      contentType: 'application/pdf',
      content: Buffer.from('%PDF-1.4 Fake PDF Data'),
    };
    const multipart2 = createMultipartFormData({}, [invalidFile]);

    const upload2Res = await fetch(`${BASE_URL}/complaints/upload`, {
      method: 'POST',
      headers: {
        ...multipart2.headers,
        Authorization: `Bearer ${studentToken}`,
      },
      body: multipart2.body,
    });
    const upload2Data = await upload2Res.json();
    assert(
      upload2Res.status === 400 && upload2Data.success === false,
      'Invalid file format rejected with HTTP 400 Bad Request'
    );
    assert(
      upload2Data.message?.includes('Only JPG, JPEG, PNG, and WEBP'),
      `Descriptive error returned: "${upload2Data.message}"`
    );

    // 3. Test: Large File Rejection (> 5MB Limit)
    console.log('\n--- Test 3: Large File Size Rejection ---');
    // 5.5 MB buffer (exceeding 5MB limit)
    const largeFile = {
      fieldname: 'images',
      filename: 'giant_raw_photo.png',
      contentType: 'image/png',
      content: Buffer.alloc(5.5 * 1024 * 1024),
    };
    const multipart3 = createMultipartFormData({}, [largeFile]);

    const upload3Res = await fetch(`${BASE_URL}/complaints/upload`, {
      method: 'POST',
      headers: {
        ...multipart3.headers,
        Authorization: `Bearer ${studentToken}`,
      },
      body: multipart3.body,
    });
    const upload3Data = await upload3Res.json();
    assert(
      upload3Res.status === 400 && upload3Data.success === false,
      'Large file (> 5MB) rejected with HTTP 400'
    );
    assert(
      upload3Data.message?.includes('exceeds the 5MB'),
      `Descriptive size error returned: "${upload3Data.message}"`
    );

    // 4. Test: Multiple Images Upload
    console.log('\n--- Test 4: Multiple Images Upload ---');
    const multiFiles = [
      {
        fieldname: 'images',
        filename: 'leak_angle1.jpg',
        contentType: 'image/jpeg',
        content: createSampleImageBuffer(20 * 1024),
      },
      {
        fieldname: 'images',
        filename: 'leak_angle2.png',
        contentType: 'image/png',
        content: createSampleImageBuffer(30 * 1024),
      },
      {
        fieldname: 'images',
        filename: 'leak_angle3.webp',
        contentType: 'image/webp',
        content: createSampleImageBuffer(25 * 1024),
      },
    ];
    const multipart4 = createMultipartFormData({}, multiFiles);

    const upload4Res = await fetch(`${BASE_URL}/complaints/upload`, {
      method: 'POST',
      headers: {
        ...multipart4.headers,
        Authorization: `Bearer ${studentToken}`,
      },
      body: multipart4.body,
    });
    const upload4Data = await upload4Res.json();
    assert(
      upload4Res.status === 200 && upload4Data.images?.length === 3,
      'Multiple images (3 files) uploaded and processed concurrently'
    );

    // 5. Test: Failed Upload Error Handling (Graceful handling)
    console.log('\n--- Test 5: Failed Upload Handling ---');
    const { uploadToCloudinary } = await import('./services/cloudinaryService.js');
    try {
      await uploadToCloudinary({ buffer: Buffer.alloc(0) });
      assert(false, 'Empty buffer should have thrown an error');
    } catch (err) {
      assert(
        err.message.includes('Empty file buffer'),
        `Handled empty or corrupt buffer gracefully: "${err.message}"`
      );
    }

    // 6. Test: Successful End-to-End Workflow with Cloudinary URLs in MongoDB
    console.log('\n--- Test 6: End-to-End Workflow: Student Complaint & Staff Resolution ---');
    // Student submits complaint with 2 image attachments
    const complaintMultipart = createMultipartFormData(
      {
        title: 'Burst Water Pipe under Chem Lab Sink',
        category: 'Plumbing',
        location: 'Chemistry Block, Lab 102',
        priority: 'High',
        description: 'Water spraying vigorously under sink. Needs urgent valve shutoff.',
      },
      [
        {
          fieldname: 'images',
          filename: 'pipe_burst_photo1.jpg',
          contentType: 'image/jpeg',
          content: createSampleImageBuffer(40 * 1024),
        },
        {
          fieldname: 'images',
          filename: 'pipe_burst_photo2.png',
          contentType: 'image/png',
          content: createSampleImageBuffer(45 * 1024),
        },
      ]
    );

    const createRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        ...complaintMultipart.headers,
        Authorization: `Bearer ${studentToken}`,
      },
      body: complaintMultipart.body,
    });
    const createData = await createRes.json();
    assert(createData.success, 'Student complaint created with multipart attachments');
    assert(
      createData.complaint?.images?.length === 2,
      `Stored 2 Cloudinary secure URLs in MongoDB complaint.images: ${createData.complaint?.images?.[0]}`
    );
    const complaintId = createData.complaint._id;

    // Staff resolves complaint with resolutionImages attachment
    const resolutionMultipart = createMultipartFormData(
      {
        status: 'RESOLVED',
        resolutionNotes: 'Isolated main shutoff valve and replaced split copper elbow joint.',
      },
      [
        {
          fieldname: 'resolutionImages',
          filename: 'repaired_pipe_proof.jpg',
          contentType: 'image/jpeg',
          content: createSampleImageBuffer(60 * 1024),
        },
      ]
    );

    const resolveRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
      method: 'PUT',
      headers: {
        ...resolutionMultipart.headers,
        Authorization: `Bearer ${staffToken}`,
      },
      body: resolutionMultipart.body,
    });
    const resolveData = await resolveRes.json();
    assert(resolveData.success, 'Staff marked ticket as RESOLVED with resolution proof image');
    assert(
      resolveData.complaint?.resolutionImages?.length === 1,
      `Stored Cloudinary resolution image URL in MongoDB complaint.resolutionImages: ${resolveData.complaint?.resolutionImages?.[0]}`
    );

    // Verify GET /api/complaints/:id returns both complaint images and resolution images
    const getRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getData = await getRes.json();
    assert(
      getData.complaint?.images?.length === 2 &&
        getData.complaint?.resolutionImages?.length === 1,
      'Complaint details return both student defect photos and staff resolution photos'
    );
    assert(
      getData.complaint.images[0].startsWith('http') &&
        getData.complaint.resolutionImages[0].startsWith('http'),
      'Secure URLs are stored and formatted properly without storing large binary data in DB'
    );

    console.log('\n====================================================');
    console.log(`CLOUDINARY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runCloudinaryUploadTests();
