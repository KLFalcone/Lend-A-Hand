import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import connectDB from "./db.js";

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

// ===== TEMP in-memory users (until we swap to Mongo) =====
const users = [];

// Seed an admin user for testing
(async () => {
  const email = "admin@email.com";
  const password = "admin";
  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed, role: "admin" });
  console.log(`✓ Seeded admin user: ${email} (password: ${password})`);
})();

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

// Register
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed, role: "user" });
  res.status(201).json({ message: "User registered" });
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login successful", token, role: user.role });
});

// Promote user to admin (admin-only)
app.post("/auth/make-admin", authenticateToken, requireAdmin, (req, res) => {
  const { email } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = "admin";
  res.json({ message: `${email} is now an admin` });
});
