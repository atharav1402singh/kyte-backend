// server.js
import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import { Server } from "socket.io";

// load .env
dotenv.config();

// middleware import (static imports must be at top)


// create app AFTER imports
const app = express();

// use request logger AFTER app is created

// ------------ CORS ------------
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://kyte-frontend-ui.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ------------ CONFIG ------------
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// ------------ MONGO CONNECT ------------
console.log("MONGO_URI:", MONGO_URI);
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// ------------ RAZORPAY ------------
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ------------ SOCKET.IO ------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://kyte-frontend-ui.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

// make io available in routes
app.locals.io = io;

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Broadcast GPS
  socket.on("driverLocation", (loc) => io.emit("updateDriverLocation", loc));
  socket.on("customerLocation", (loc) => io.emit("updateCustomerLocation", loc));

  // Ride rooms
  socket.on("join:ride", ({ rideId } = {}) => {
    if (!rideId) return;
    socket.join(`ride_${rideId}`);
  });

  // Driver rooms
  socket.on("join:driver", ({ driverId } = {}) => {
    if (!driverId) return;
    socket.join(`driver_${driverId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ------------ ROUTES ------------
import paymentRoutes from "./routes/paymentRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import fareRoutes from "./routes/fareRoutes.js";

app.use("/api/payment", paymentRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/fare", fareRoutes);

// ------------ BASIC ENDPOINTS ------------
app.get("/api", (req, res) => {
  res.json({ success: true, message: "Kyte Backend Running 🚀" });
});

app.get("/api/razorpay/key", (req, res) => {
  res.json({ success: true, key: RAZORPAY_KEY_ID });
});

// ------------ GLOBAL ERROR ------------
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err?.message || String(err),
  });
});

// ------------ START ------------
server.listen(PORT, () => {
  console.log(`🚀 Kyte Backend Live on ${PORT}`);
});
