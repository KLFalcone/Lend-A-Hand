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
    const password3 = await bcrypt.hash("toyota123", 10);
    const password4 = await bcrypt.hash("pomeranians4Lif3", 10);
    const password5 = await bcrypt.hash("beautyqueen1984", 10);

    const user1 = await User.create({
      email: "user@example.com",
      password: password1,
      role: "user"
    });

    const emily = await User.create({
      email: "emily.bowers@gmail.com",
      password: password3,
      role: "user"
    });

    const nealvon = await User.create({
      email: "nealvon.elwell@gmail.com",
      password: password4,
      role: "user"
    });

    const becky = await User.create({
      email: "rebecca.jones@aol.com",
      password: password5,
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
      },
      {
        title: "Need a ride to airport",
        description: "Need a ride to the airport tomorrow. I have to be there by 3pm",
        createdBy: becky._id
      },
      {
        title: "Need a ride to hospital!",
        description: "Need a ride to the hospital asap, I am having terrible back pain!",
        createdBy: nealvon._id
      },
      {
        title: "Need help with plumbing",
        description: "Need someone to look at my plumbing, I have to turn my water off due to a broken pipe under my sink",
        createdBy: emily._id
      },
      {
        title: "Need babysitter this Saturday",
        description: "Need a babysitter this Saturday so that I can get some errands done",
        createdBy: becky._id
      },
      {
        title: "Need a place to stay tonight",
        description: "Need a place to stay tonight, one adult and three children under ten",
        createdBy: emily._id
      },
      {
        title: "Need help painting",
        description: "Need help painting my house before it rains this weekend",
        createdBy: user1._id
      },
      {
        title: "Need tailor for some work clothes",
        description: "Need someone to tailor some work pants that I bought",
        createdBy: nealvon._id
      },
      {
        title: "Need school supplies",
        description: "Looking for donations of school supplies for my classroom",
        createdBy: becky._id
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
