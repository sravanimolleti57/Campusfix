import mongoose from 'mongoose';
import dns from 'dns';

let memoryServerInstance = null;

// Configure reliable DNS servers to prevent querySrv ECONNREFUSED issues on Windows with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Graceful fallback if environment restricts dns.setServers
}

/**
 * Reusable MongoDB Connection Function using Mongoose
 * Connects to process.env.MONGODB_URI (e.g. Atlas or local MongoDB).
 * If local MongoDB is unavailable during development, initializes an in-memory MongoDB
 * so that all authentication, schema validation, and queries function against real MongoDB.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusfix';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB Connected]: Connected to ${conn.connection.host}`);
    return conn;
  } catch (primaryError) {
    // If not in production and local MongoDB connection failed, fallback to MongoMemoryServer
    if (process.env.NODE_ENV !== 'production' && !mongoUri.includes('mongodb+srv://')) {
      console.warn(`[MongoDB Notice]: Local MongoDB at ${mongoUri} was unreachable.`);
      console.log(`[MongoDB Initializing]: Starting real in-memory MongoDB instance for development...`);

      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!memoryServerInstance) {
          memoryServerInstance = await MongoMemoryServer.create();
        }
        const memoryUri = memoryServerInstance.getUri();

        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB Connected]: Connected to in-memory MongoDB at ${conn.connection.host}`);
        console.log(`[Tip]: For permanent storage, set MONGODB_URI in server/.env to your MongoDB Atlas connection string.`);
        return conn;
      } catch (memError) {
        console.error(`[MongoDB Memory Server Error]: ${memError.message}`);
        throw primaryError;
      }
    }

    console.error(`[MongoDB Connection Error]: ${primaryError.message}`);
    throw primaryError;
  }
};

export default connectDB;
