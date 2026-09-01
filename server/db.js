import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  // Without this, mongoose queues queries indefinitely waiting for a connection that may never
  // come (e.g. MONGO_URI unset or unreachable), so a request just hangs forever instead of
  // failing with a catchable error the route handlers can turn into a normal 500 response.
  mongoose.set("bufferCommands", false);

  if (!uri) {
    console.warn("===== MONGO_URI is not set — auth and dataset-sync routes will fail until it's configured in server/.env =====");
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("===== MongoDB connection error =====");
    console.error(error);
  }
}
