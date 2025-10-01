import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

const users = []; // In-memory user store
const JWT_SECRET = "supersecretkey"; // In production, use process.env.JWT_SECRET

// --- Default Admin Account for Testing Purposes ---
(async () => {
  const email = "admin@email.com";
  const password = "admin"; 
  const hashed = await bcrypt.hash(password, 10);

  users.push({ email, password: hashed, role: "admin" });
  console.log(`Seeded admin user: ${email} (password: ${password})`);
})();

// Middleware: verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expect "Bearer TOKEN"
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user; // { email, role }
    next();
  });
}

// Middleware: require admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
}


app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "backend" });
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

  // Default role = "user"
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

  const token = jwt.sign(
    { email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ message: "Login successful", token, role: user.role });
});

// Promote a user to admin (only accessible by admins)
app.post("/auth/make-admin", authenticateToken, requireAdmin, (req, res) => {
  const { email } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = "admin";
  res.json({ message: `${email} is now an admin` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
