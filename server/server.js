import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { seedInitialUsers } from './utils/seedUsers.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware: CORS Configuration for Production & Development
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5001',
  'https://campusfix-vert.vercel.app',
];

const envOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/+$/, ''))
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile apps, curl, Postman, dev tools)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');

      // Allow listed origins, Vercel deployments, or local environments
      const isAllowed =
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.startsWith('http://localhost:');

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Middleware: Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (e.g. complaint proof photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health-Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusFix API is running',
  });
});

// Authentication & User Routes
app.use('/api/auth', authRoutes);

// Complaint Management Routes
app.use('/api/complaints', complaintRoutes);

// Administration Portal Routes (Admin only)
app.use('/api/admin', adminRoutes);

// Staff / Technician Portal Routes (Staff only)
app.use('/api/staff', staffRoutes);

// In-App Notification System Routes
app.use('/api/notifications', notificationRoutes);

// Production-Safe Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[CampusFix Error]:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production' && (!err.status || err.status === 500)
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error',
  });
});

// 404 Fallback Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB and start Express only after successful connection
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialUsers();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[CampusFix Server]: Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[Server Start Aborted]: Express will not start without an active database connection.`);
    console.error(`Reason: ${error.message}`);
    console.error(`[Action Required]: Please ensure MongoDB is running or configure a valid MONGODB_URI in server/.env`);
    // Connection error handled gracefully without unhandled rejection or crashing
  }
};

// Only start server automatically if executed directly (e.g., node server.js)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.js') || 
  process.argv[1].endsWith('server')
);

if (isDirectRun) {
  startServer();
}

export { startServer, connectDB };
export default app;
