import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import connectDB from "./db.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // fallback for local dev

// --- Connect DB, then start server ---
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect DB:", err.message);
    process.exit(1);
  });

// ===== Auth middleware =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user; // { email, role }
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
}

// ===== Routes =====

// Health now includes DB status
app.get("/api/health", (req, res) => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  const dbState = states[mongoose.connection.readyState] ?? "unknown";

  res.json({
    ok: true,
    service: "backend",
    db: dbState,
    ts: new Date().toISOString(),
  });
});

// ===== Auth Routes =====

// Register
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, role: "user" });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Promote user to admin (admin-only)
app.post("/auth/make-admin", authenticateToken, requireAdmin, async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "admin";
    await user.save();
    res.json({ message: `${email} is now an admin` });
  } catch (err) {
    console.error("Make-admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== Profile Routes =====

// Get current user's profile
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update current user's profile
app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { email, password, ...rest } = req.body;

    // If password is provided, hash it before updating
    const updateFields = { ...rest };
    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    // Allow email update but check for uniqueness
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "Email already in use" });
      }
      updateFields.email = email;
    }

    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: updateFields },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete current user's profile
app.delete("/api/profile", authenticateToken, async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ email: req.user.email });
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
