import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  console.warn(
    "⚠️ Warning: MONGODB_URI environment variable is not defined. The app will fall back to local database emulation or client-side storage."
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

// Extend global type to support caching in Next.js development mode
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache as MongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000, // Timeout after 2 seconds instead of 30 seconds
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("🟢 Connected to MongoDB successfully!");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("🔴 Failed to connect to MongoDB:", err.message || err);
        return null;
      });
  }

  try {
    const conn = await cached.promise;
    if (!conn) {
      cached.promise = null; // Reset promise so we can try to connect again in future calls
      return null;
    }
    cached.conn = conn;
  } catch (e) {
    cached.promise = null;
    console.error("🔴 Failed to connect to MongoDB:", e);
    return null;
  }

  return cached.conn;
}
