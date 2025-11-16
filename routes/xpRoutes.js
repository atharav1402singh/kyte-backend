import express from "express";
import { getLeaderboard } from "../services/xpService.js";

const router = express.Router();

// 🏆 GET /api/xp/leaderboard → Top 10 drivers
router.get("/leaderboard", async (req, res) => {
  try {
    const topDrivers = await getLeaderboard();

    if (!topDrivers.length) {
      return res.json({
        success: true,
        message: "No XP data yet. Complete rides to earn XP!",
        leaderboard: [],
      });
    }

    res.json({
      success: true,
      leaderboard: topDrivers.map((d, i) => ({
        rank: i + 1,
        name: d.driverId?.name || "Unknown",
        xp: d.totalXP,
        level: d.currentLevel,
      })),
    });
  } catch (err) {
    console.error("❌ Leaderboard error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

export default router;
