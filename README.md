# CampusFix – Smart Campus Problem Reporting and Resolution System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-47A248.svg)](https://www.mongodb.com/)

---

## 1. Project Overview

**CampusFix** is a production-grade, full-stack MERN (MongoDB, Express.js, React, Node.js) web application designed to digitize and streamline institutional campus infrastructure maintenance. 

In traditional campus environments, problem reporting relies on paper logbooks, informal chat groups, or verbal requests that lack accountability, status transparency, and proof of completion. CampusFix replaces these outdated mechanisms with a structured digital chain of custody—connecting **Students**, **Campus Administration**, and **Trade Maintenance Technicians** on a single unified platform.

---

## 2. Problem Statement

University campuses manage dozens of academic blocks, research laboratories, residential hostels, and student dining facilities. Typical recurring maintenance bottlenecks include:
- **Lost Paperwork & Informal Requests:** Verbal requests made to wardens or facility managers are frequently forgotten or lost.
- **Zero Status Visibility:** Students have no tracking mechanism to know whether a broken geyser, projector failure, or electrical fault is being addressed.
- **Triage Inefficiency:** Administrative teams struggle to prioritize urgent safety hazards over routine cosmetic requests.
- **Lack of Verification:** Work orders are marked closed by maintenance crews without student verification or photographic evidence.
- **Missing Data Insights:** Campus estates departments lack analytics to identify recurring equipment failures or allocate maintenance budgets effectively.

---

## 3. Proposed Solution

CampusFix provides an end-to-end digital solution that enforces:
1. **Instant Digital Reporting:** Students log defects with precise room locations, problem categories, and photographic evidence.
2. **Administrative Triage & Dispatch:** Admins assign severity priorities (Low, Medium, High, Critical) and route tickets directly to specialized technicians (Electrical, Plumbing, IT, etc.).
3. **Technician Workflow & Proof of Fix:** Technicians view on-site task queues, record work progression, and upload post-repair photographs.
4. **Student Verification & Rating:** Tickets only reach the `CLOSED` state after the reporting student confirms the fix and submits a 1–5 star rating with feedback.
5. **Real-time Analytics:** Interactive dashboards featuring Recharts display category distribution, monthly volume trends, priority breakdowns, and student satisfaction metrics.

---

## 4. Key Features

- **Production-Grade Search, Filtering, Sorting & Pagination:**
  - Multi-parameter backend filtering (`page`, `limit`, `search`, `status`, `priority`, `category`, `sortBy`, `sortOrder`).
  - Implemented with indexed MongoDB regex matching and dynamic query builders.
- **Role-Based Access Control (RBAC):**
  - Strictly isolated portal interfaces and protected API endpoints for `student`, `staff`, and `admin` roles.
- **Visual Resolution Lifecycle Progression:**
  - Standardized 7-stage state machine with step indicators: `SUBMITTED` &rarr; `UNDER_REVIEW` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` &rarr; `VERIFIED` &rarr; `CLOSED` (or `REOPENED`).
- **Activity Timeline & Audit Trail:**
  - Immutable historical activity timeline logged for every action (creation, triage, assignment, commencement, notes, verification, reopening).
- **Evidence Photo Upload & Cloud Storage:**
  - Photographic proof handling via Cloudinary with automatic fallback to local multipart storage.
- **Interactive Recharts Analytical Dashboard:**
  - Category comparison bar charts, status distribution pie charts, 6-month historical intake/closure area curves, and priority triage breakdown.
- **In-App Notification Center:**
  - Real-time unread counter, notification drawer, mark-as-read, and mark-all-read capabilities.
- **Two-Way Resolution Verification:**
  - Students can either **Confirm Resolution** (advancing to `CLOSED`) or report **Problem Still Exists** (reopening the ticket with mandatory reason notes).
- **Zero-Setup Database Fallback:**
  - Automatically initializes an in-memory MongoDB instance (`mongodb-memory-server`) during local development if an external MongoDB connection is unavailable.

---

## 5. User Roles & Permissions

| Feature / Capability | Student | Staff (Technician) | Admin |
| :--- | :---: | :---: | :---: |
| Self-Registration & Login | Yes | Login Only (Provisioned by Admin) | Login Only (Pre-seeded) |
| Report Complaint + Photos | Yes | No | No |
| View "My Complaints" + Live Tracking | Yes | No | No |
| Edit / Cancel Unassigned Tickets | Yes | No | No |
| View Assigned Task Queue | No | Yes (Scoped to Self) | Yes (All Tasks) |
| Accept & Start Work Order | No | Yes | No |
| Log Progress Notes & Photos | No | Yes | No |
| Submit Resolution Report + Proof | No | Yes | No |
| Verify Resolution & Rate (1–5 Stars) | Yes | No | No |
| Reopen Unresolved Defect | Yes | No | No |
| Administrative Triage & Priority Set | No | No | Yes |
| Dispatch Work Order to Staff | No | No | Yes |
| Analytics & Recharts Dashboards | No | No | Yes |
| Manage User Directory & Suspension | No | No | Yes |
| Provision & Manage Technicians | No | No | Yes |
| Category & Location Breakdown Metrics | No | No | Yes |

---

## 6. System Workflow

```
[Student Reports Defect]
         │
         ▼
    (SUBMITTED) ───► Admin reviews & prioritizes ticket
         │
         ▼
   (UNDER_REVIEW) ───► Admin assigns designated technician
         │
         ▼
     (ASSIGNED) ───► Technician accepts task & commences work
         │
         ▼
   (IN_PROGRESS) ───► Technician completes repair & attaches proof photos
         │
         ▼
     (RESOLVED)
         │
         ├───► Student Confirms Resolution ──► (VERIFIED) ──► (CLOSED) [Feedback Logged]
         │
         └───► Student: "Problem Still Exists" ──► (REOPENED) ──► Retriaged
```

---

## 7. Technology Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 6
- **Routing:** React Router DOM v6
- **Styling:** Vanilla CSS & Tailwind CSS v4 design system
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **HTTP Client:** Axios with centralized interceptors (Bearer tokens, 401 handling)

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 4
- **Database:** MongoDB & Mongoose 8
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **File Uploads:** Multer with Cloudinary v2 SDK
- **Security:** CORS, parameterized queries, sanitized regex, HTTP status codes, structured error handler
- **In-Memory Testing DB:** `mongodb-memory-server`

---

## 8. Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Vite + React SPA                     │
│  (AuthContext, ToastContext, Role Guards, UI Tokens)   │
└───────────────────────────┬────────────────────────────┘
                            │ REST API Requests (JSON / Multipart)
                            │ Bearer JWT Authentication
┌───────────────────────────▼────────────────────────────┐
│                    Express.js API                      │
│   ├── authMiddleware (JWT Verification)                │
│   ├── roleMiddleware (student / staff / admin scope)   │
│   ├── queryHelper (Search, Filter, Sort, Pagination)   │
│   └── activityLogger (Audit Trail Tracker)             │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│     MongoDB Atlas     │       │   Cloudinary Media    │
│ (Users, Complaints,   │       │   (Defect Evidence &  │
│  Notifications)       │       │    Resolution Proof)  │
└───────────────────────┘       └───────────────────────┘
```

---

## 9. Project Structure

```text
campusfix/
├── client/                                 # Frontend SPA
│   ├── public/                             # Public static assets
│   ├── src/
│   │   ├── assets/                         # Component icons & media
│   │   ├── components/                     # Reusable modular UI components
│   │   │   ├── complaints/                 # ComplaintTimeline, etc.
│   │   │   └── ui/                         # ConfirmModal, EmptyState, ErrorMessage, Loading
│   │   ├── context/                        # AuthContext, ToastContext
│   │   ├── pages/                          # Application view pages
│   │   │   ├── admin/                      # AdminDashboard, Complaints, Staff, Users, Categories
│   │   │   ├── auth/                       # LoginPage, RegisterPage
│   │   │   ├── staff/                      # StaffDashboard, StaffComplaints, StaffDetail
│   │   │   ├── student/                    # StudentDashboard, MyComplaints, ReportComplaint, Details
│   │   │   ├── HomePage.jsx                # Institutional landing page
│   │   │   └── UnauthorizedPage.jsx        # 403 Access Denied handler
│   │   ├── routes/                         # ProtectedRoute guards
│   │   ├── services/                       # Centralized Axios API services
│   │   ├── utils/                          # Badge generators, icons, date helpers
│   │   ├── App.jsx                         # Main router configuration
│   │   ├── index.css                       # Design tokens, stat-card hover lift, typography
│   │   └── main.jsx                        # React root entry
│   ├── .env.example                        # Client environment variables blueprint
│   ├── package.json
│   └── vite.config.js                      # Vite configuration & dev proxy
│
└── server/                                 # Backend REST API
    ├── config/
    │   └── db.js                           # Mongoose connection with Atlas & memory fallback
    ├── controllers/                        # Business logic handlers
    │   ├── adminController.js              # Admin metrics, user toggle, triage
    │   ├── authController.js               # Registration, login, current profile
    │   ├── complaintController.js          # CRUD, student verification, reopening
    │   ├── notificationController.js       # Notification read & unread count
    │   └── staffController.js              # Technician queue, start work, resolution
    ├── middleware/                         # Authentication & authorization guards
    │   ├── authMiddleware.js               # JWT Bearer token validator
    │   ├── errorMiddleware.js              # Production error handling
    │   └── uploadMiddleware.js             # Multer multipart upload processor
    ├── models/                             # Mongoose database schemas
    │   ├── Complaint.js                    # Complaint schema with timeline & feedback
    │   ├── Notification.js                 # In-app notification schema
    │   └── User.js                         # User account schema with bcrypt hashing
    ├── routes/                             # Express route definitions
    ├── services/                           # Cloudinary upload service
    ├── utils/                              # Query helper, activity logger, seed users
    ├── uploads/                            # Local upload storage directory
    ├── .env.example                        # Server environment variables blueprint
    ├── package.json
    └── server.js                           # Express entry point & health check
```

---

## 10. Database Collections

### 1. `users`
- `name` (String, required)
- `email` (String, required, unique, lowercase)
- `password` (String, required, bcrypt hashed)
- `role` (String, enum: `student`, `staff`, `admin`, default: `student`)
- `studentId` (String, student roll/matriculation number)
- `employeeId` (String, staff/admin identification)
- `department` (String, academic branch or maintenance trade)
- `phone` (String, contact phone)
- `isActive` (Boolean, default: `true`, for account suspension)
- `createdAt`, `updatedAt` (Timestamps)

### 2. `complaints`
- `complaintId` (String, unique formatted ID, e.g., `CMP-1001`)
- `title` (String, required)
- `description` (String, required)
- `category` (String, enum: Electrical, Plumbing, Internet/Wi-Fi, Classroom, Laboratory, Hostel, Cleaning, Furniture, Security, Other)
- `location` (String, required)
- `priority` (String, enum: `Low`, `Medium`, `High`, `Critical`, default: `Medium`)
- `status` (String, enum: `SUBMITTED`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `VERIFIED`, `CLOSED`, `REOPENED`)
- `images` (Array of Strings, URLs)
- `reportedBy` (ObjectId &rarr; `User`)
- `assignedTo` (ObjectId &rarr; `User`)
- `adminNotes` (String)
- `resolutionNotes` (String)
- `resolutionImages` (Array of Strings, URLs)
- `studentFeedback`: `{ rating: Number (1-5), comment: String, submittedAt: Date }`
- `timeline`: Array of `{ status, message, updatedBy: ObjectId, timestamp }`
- `resolvedAt`, `closedAt`, `createdAt`, `updatedAt` (Timestamps)

### 3. `notifications`
- `recipient` (ObjectId &rarr; `User`)
- `title` (String, required)
- `message` (String, required)
- `type` (String, enum: `COMPLAINT_SUBMITTED`, `COMPLAINT_ASSIGNED`, `WORK_STARTED`, `COMPLAINT_RESOLVED`, `COMPLAINT_REOPENED`, `COMPLAINT_CLOSED`)
- `complaintId` (ObjectId &rarr; `Complaint`)
- `isRead` (Boolean, default: `false`)
- `createdAt`, `updatedAt` (Timestamps)

---

## 11. API Overview

### Health
- `GET /api/health` — System status health check

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new student account
- `POST /api/auth/login` — Sign in and obtain JWT
- `GET /api/auth/me` — Retrieve current authenticated profile

### Complaints (`/api/complaints`)
- `POST /api/complaints` — Submit complaint ticket (supports multipart image uploads)
- `GET /api/complaints/my` — Fetch student complaints with pagination, filtering & sorting
- `GET /api/complaints/:id` — Retrieve full complaint details and activity timeline
- `PUT /api/complaints/:id` — Edit unassigned complaint details
- `DELETE /api/complaints/:id` — Cancel / delete unassigned ticket
- `POST /api/complaints/:id/verify` — Confirm resolution (transitions `RESOLVED` &rarr; `VERIFIED` &rarr; `CLOSED`)
- `POST /api/complaints/:id/reopen` — Reopen defect with mandatory reason notes
- `POST /api/complaints/:id/feedback` — Submit 1–5 star rating and comments

### Staff Portal (`/api/staff`)
- `GET /api/staff/dashboard` — Technician metrics (total assigned, pending start, in-progress, urgent tasks)
- `GET /api/staff/complaints` — Filtered task queue assigned to logged-in technician
- `GET /api/staff/complaints/:id` — Task details with student contact information
- `POST /api/staff/complaints/:id/start-work` — Accept assignment (transitions `ASSIGNED` &rarr; `IN_PROGRESS`)
- `POST /api/staff/complaints/:id/progress` — Record intermediate work progression notes & photos
- `POST /api/staff/complaints/:id/resolve` — Submit resolution report with completion photos

### Administration (`/api/admin`)
- `GET /api/admin/dashboard` — Global statistics and Recharts analytics datasets
- `GET /api/admin/complaints` — Master complaint registry with multi-parameter filtering
- `POST /api/admin/complaints/:id/assign` — Assign/dispatch ticket to technician
- `PATCH /api/admin/complaints/:id/status` — Modify ticket status or priority
- `GET /api/admin/users` — Campus user directory with search & role filters
- `PATCH /api/admin/users/:id/toggle-status` — Activate or suspend user account
- `GET /api/admin/staff` — List technicians with workload statistics
- `POST /api/admin/staff` — Provision new technician account
- `GET /api/admin/categories` — Category statistics and resolution rates
- `GET /api/admin/locations` — Location defect breakdown and active ticket counts

### Notifications (`/api/notifications`)
- `GET /api/notifications` — Fetch user notification feed
- `GET /api/notifications/unread-count` — Get total unread count
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read

---

## 12. Authentication

CampusFix uses stateless **JSON Web Token (JWT)** authentication:
1. Upon successful login (`/api/auth/login`), the server signs a JWT containing the user's `id` and `role`.
2. The client stores the token in `localStorage` under `campusfix_token`.
3. Axios interceptors automatically attach the token in the `Authorization: Bearer <token>` header for all outgoing requests.
4. Passwords are encrypted before storage using `bcryptjs` with salt rounds = 10.
5. In the event of token expiration or invalidity (401 Unauthorized), the client clears credentials and routes the user to the login screen.

---

## 13. Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- Git

### Clone the Repository
```bash
git clone https://github.com/your-username/campusfix.git
cd campusfix
```

### Install Backend Dependencies
```bash
cd server
npm install
```

### Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## 14. Environment Variables

### Backend Configuration (`server/.env`)
Create a `.env` file in the `server` directory based on `server/.env.example`:

```env
# Server Port & Mode
PORT=5000
NODE_ENV=development

# Database Connection (MongoDB Atlas or Local MongoDB)
MONGODB_URI=mongodb://localhost:27017/campusfix

# JWT Secret & Expiration
JWT_SECRET=your_super_secret_jwt_key_here_2026
JWT_EXPIRE=30d

# Client Application URL (For CORS whitelist)
CLIENT_URL=http://localhost:5173,http://localhost:5174

# Cloudinary Storage (Optional - falls back to local storage if unset)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Email Configuration (Optional - falls back to development logging)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
EMAIL_FROM=CampusFix Facilities Desk <no-reply@campusfix.edu>
```

### Frontend Configuration (`client/.env`)
Create a `.env` file in the `client` directory based on `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CampusFix
```

---

## 15. Running Locally

### Start Backend Development Server
```bash
cd server
node server.js
# Or with automatic restarts:
npm run dev
```

> **Note:** If local MongoDB is not running, CampusFix automatically spins up an in-memory MongoDB database instance (`mongodb-memory-server`) and seeds default accounts so you can test immediately.

### Start Frontend Development Server
In a separate terminal:
```bash
cd client
npm run dev
```
Open your browser at `http://localhost:5173` (or the port allocated by Vite).

### Default Seed Accounts (for Testing)
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@campusfix.edu` | `adminpassword123` |
| **Staff (Electrician)** | `staff@campusfix.edu` | `staffpassword123` |
| **Student** | `student@campusfix.edu` | `studentpassword123` |

*(Quick-fill buttons for these accounts are also provided directly on the Login page).*

---

## 16. Screenshots Section Placeholders

<!-- Place screenshots in a /docs/screenshots directory and link here -->

| Landing Page | Student Dashboard |
| :---: | :---: |
| ![CampusFix Landing Page](https://via.placeholder.com/600x340/0f172a/38bdf8?text=CampusFix+Landing+Page) | ![Student Dashboard](https://via.placeholder.com/600x340/0f172a/38bdf8?text=Student+Dashboard) |

| Admin Recharts Analytics | Staff Task Resolution Desk |
| :---: | :---: |
| ![Admin Analytics Dashboard](https://via.placeholder.com/600x340/0f172a/38bdf8?text=Admin+Analytics+Recharts) | ![Staff Task Desk](https://via.placeholder.com/600x340/0f172a/38bdf8?text=Technician+Work+Desk) |

---

## 17. Testing

### Run Backend Automated Verification Tests
CampusFix includes automated API test suites for all major controllers:

```bash
cd server
npm run test:auth          # Verifies registration, login, token validation, wrong credentials
npm run test:complaint     # Verifies complaint submission, validation, isolation
npm run test:admin         # Verifies triage, staff assignment, role permissions
npm run test:staff         # Verifies task acceptance, progress logging, resolution
npm run test:query         # Verifies backend search, filtering, sorting, pagination
npm run test:notifications # Verifies in-app notification triggers and read states
npm run test:feedback      # Verifies 1-5 star feedback and verified closure
npm run test:timeline      # Verifies immutable activity audit log
```

### Run Frontend Production Build Validation
```bash
cd client
npm run build
```
Verifies that all React components, hooks, Tailwind CSS v4 tokens, and Recharts charts compile without syntax, type, or bundling errors.

---

## 18. Deployment

### Frontend (e.g., Vercel / Netlify)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Configure environment variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://api.campusfix.edu/api`)

### Backend (e.g., Render / Railway / AWS EC2)
1. Set start command: `node server.js`
2. Configure environment variables:
   - `NODE_ENV=production`
   - `PORT=5000` (or dynamic provider port)
   - `MONGODB_URI`: Production MongoDB Atlas connection string
   - `JWT_SECRET`: 64-character random secure string
   - `CLIENT_URL`: Your deployed frontend domain (e.g., `https://campusfix.vercel.app`)
   - `CLOUDINARY_*`: Cloudinary production credentials

---

## 19. Future Enhancements

- **Push Notifications:** Web Push API / Service Workers for real-time mobile browser alerts.
- **SLA Escalation Automation:** Automated notification to chief warden if a `Critical` ticket remains unassigned after 2 hours.
- **Campus Geo-Mapping:** Interactive campus map pinpointing live clusters of open maintenance requests.
- **Inventory & Spare Parts Tracking:** Ledger for technicians to deduct replacement parts from campus stores during repair.
- **Multi-Campus Support:** Tenancy partitioning for multi-campus university systems.

---

## 20. Contributors

Developed as a modern institutional engineering solution for campus infrastructure maintenance. Contributions, bug reports, and feature proposals are welcome via pull requests and GitHub issues.
