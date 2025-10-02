import mongoose from "mongoose";

export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas");
    return mongoose.connection;
  } catch (err) {
    console.error("Failed to connect DB:", err.message);
    process.exit(1);
  }
}
