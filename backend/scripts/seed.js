// backend/scripts/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

// --- Define Schemas (keep them minimal for seeding) ---
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, default: "user" }
});

const requestSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const User = mongoose.model("User", userSchema);
const Request = mongoose.model("Request", requestSchema);

// --- Main Seeder ---
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding");

    // Clear old data
    await User.deleteMany({});
    await Request.deleteMany({});
    console.log("Old data cleared");

    // Create demo users
    const password1 = await bcrypt.hash("password123", 10);
    const password2 = await bcrypt.hash("adminpass", 10);

    const user1 = await User.create({
      email: "user@example.com",
      password: password1,
      role: "user"
    });

    const admin = await User.create({
      email: "admin@example.com",
      password: password2,
      role: "admin"
    });

    console.log("👤 Seeded users:", [user1.email, admin.email]);

    // Create sample requests
    await Request.create([
      {
        title: "Need groceries picked up",
        description: "Looking for someone to grab groceries from the store",
        createdBy: user1._id
      },
      {
        title: "Dog walking help",
        description: "Need a dog walker for 30 minutes this evening",
        createdBy: admin._id
      }
    ]);

    console.log("Sample requests added");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err.message);
    process.exit(1);
  }
}

seed();
