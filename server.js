import mongoose from "mongoose";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Direct MongoDB connection string (bypasses env)
const MONGO_URI = process.env.MONGO_URI || "fallback";
console.log("🔍 Checking MONGO_URI:", MONGO_URI);

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed", err));

app.get("/", (req, res) => res.send("Backend is working fine!"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
