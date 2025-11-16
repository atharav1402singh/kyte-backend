// ✅ Import dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fareRoutes from "./routes/fare.js";

import User from "./models/User.js"; // Make sure this file exists

// ✅ Initialize dotenv (loads .env variables)
dotenv.config();

// ✅ Create express app
const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
const PORT = process.env.PORT || 8080;
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://atharav1402singh_db_user:Atharav1246singh@kytecluster.j5kpge9.mongodb.net/?appName=KyteCluster";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed", err));
  app.use("/api", fareRoutes);


// ✅ Default route
app.get("/", (req, res) => {
  res.send("Backend is working fine!");
});

// ✅ Signup route
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, "SECRET_KEY", { expiresIn: "1d" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Token verification middleware
function verifyToken(req, res, next) {
  const header = req.headers["authorization"]; // or "Authorization"
  console.log("🟡 Received Token:", header); // Debug log

  if (!header)
    return res.status(401).json({ message: "Access Denied: No token provided" });

  // Support both raw and Bearer tokens
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : header;

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verify failed:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// ✅ Auth-check route (protected)
app.get("/auth-check", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      message: "✅ Token is valid",
      user,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
