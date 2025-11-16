// routes/fareRoutes.js
import express from "express";
import { calculateFare } from "../services/fareCalculator.js";

const router = express.Router();

router.post("/calculate", async (req, res) => {
  try {
    const { pickup, drop, distance_km = 0, duration_min = 0, city } = req.body;

    const result = await calculateFare({
      pickup,
      drop,
      distance_km: Number(distance_km) || 0,
      duration_min: Number(duration_min) || 0,
      customerCity: city,
    });

    // return format compatible with existing frontend (estimated_fare in rupees)
    res.json({
      success: true,
      estimated_fare: result.final_fare,
      meta: {
        base_fare: result.base_fare,
        competitorInfo: result.competitorInfo || null,
        appliedRules: result.appliedRules || {},
      },
    });
  } catch (err) {
    console.error("Fare calc error:", err);
    res.status(500).json({ success: false, error: "Fare calc failed" });
  }
});

export default router;
