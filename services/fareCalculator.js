// services/fareCalculator.js
import PricingRule from "../models/PricingRule.js";
import { getCompetitorPrices } from "./competitorService.js";

/**
 * calculateFare - returns final fare in rupees (integer)
 * Input distance_km & duration_min are numbers.
 */
export async function calculateFare({ pickup, drop, distance_km = 0, duration_min = 0, customerCity }) {
  // base parameters (in rupees)
  const BASE = 40;
  const PER_KM = 12;
  const PER_MIN = 1.5;

  // naive system fare
  let kyteFare = Math.round(BASE + distance_km * PER_KM + duration_min * PER_MIN);

  // Competitor comparison (5% cheaper than lowest)
  try {
    const competitor = await getCompetitorPrices(pickup, drop);
    if (competitor?.lowestPrice) {
      // competitor.lowestPrice is in rupees
      const candidate = Math.max(30, Math.round(competitor.lowestPrice * 0.95)); // min ₹30 safeguard
      kyteFare = Math.round(candidate);
    }
    // attach competitor info later
  } catch (e) {
    console.warn("Competitor check failed:", e.message);
  }

  // First 50 customers per city (20% OFF)
  let appliedFirst50 = false;
  try {
    if (customerCity) {
      const rule = await PricingRule.findOne({ city: customerCity });
      if (rule && (typeof rule.first50Left === "number" ? rule.first50Left > 0 : (rule.first50 || 50) > 0)) {
        kyteFare = Math.round(kyteFare * 0.8);
        appliedFirst50 = true;
      }
    }
  } catch (e) {
    console.warn("PricingRule check failed:", e.message);
  }

  return {
    final_fare: Math.max(30, Math.round(kyteFare)), // rupees
    base_fare: BASE,
    competitorInfo: null, // filled by fareRoutes if needed by calling getCompetitorPrices directly
    appliedRules: {
      first50: appliedFirst50,
    },
  };
}
