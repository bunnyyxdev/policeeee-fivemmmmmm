import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // Check for MONGODB_URI at runtime, not at module load time
  // This allows Next.js to build without requiring the env variable
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'police';

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch((error) => {
      cached.promise = null;
      // Provide more helpful error messages
      if (error.name === 'MongooseServerSelectionError') {
        const helpfulMessage = error.message.includes('whitelist') 
          ? error.message 
          : `${error.message}\n\nCommon solutions:\n1. Check if your IP address is whitelisted in MongoDB Atlas\n2. Verify your MONGODB_URI connection string is correct\n3. Check your network connection\n4. Ensure your MongoDB Atlas cluster is running`;
        throw new Error(helpfulMessage);
      }
      // Handle authentication errors
      if (error.code === 8000 || error.codeName === 'AtlasError' || error.message?.includes('authentication failed')) {
        throw new Error(
          `MongoDB Authentication Failed: ${error.message}\n\n` +
          `Please check your MONGODB_URI in .env file:\n` +
          `1. Verify username and password are correct\n` +
          `2. Check if the database user exists in MongoDB Atlas\n` +
          `3. Ensure the connection string format is: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority\n` +
          `4. Restart your server after updating .env file`
        );
      }
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
