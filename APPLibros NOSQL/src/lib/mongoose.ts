import mongoose from "mongoose";

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const uri = process.env.MONGODB_URI!;
if (!uri) {
  throw new Error("Please add MONGODB_URI to .env");
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

async function connect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }
  cached.conn = await cached.promise;
  global.mongooseCache = cached;
  return cached.conn;
}

export default connect;
