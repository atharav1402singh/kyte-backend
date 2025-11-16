// routes/fare.js
import express from "express";
import { calculateFare } from "../services/fareCalculator.js";

const router = express.Router();

/**
 * POST /calculate-fare
 * body: { city, pickup: {lat,lng}, drop: {lat,lng}, distance_km, duration_min }
 */
router.post("/calculate-fare", async (req, res) => {
  try {
    const { city, pickup, drop, distance_km, duration_min } = req.body;
    if (!city || !pickup || !drop || distance_km == null || duration_min == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await calculateFare({ city, pickup, drop, distance_km, duration_min });
    // convert paise to display INR string if you want, but return integers for safety
    return res.json({
      success: true,
      fare: {
        finalFare_paise: result.finalFare_paise,
        baseFare_paise: result.baseFare_paise,
        competitorMin_paise: result.competitorMin_paise,
        companyCommission_paise: result.companyCommission_paise,
        driverEarning_paise: result.driverEarning_paise,
        pricingRule: result.pricingRule
      }
    });
  } catch (err) {
    console.error("calculate-fare error:", err);
    return res.status(500).json({ error: err.message || "Internal error" });
  }
});

export default router;
