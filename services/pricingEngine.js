// services/pricingEngine.js
import PricingRule from "../models/PricingRule.js";
import { getCompetitorPrices } from "./competitorService.js";

/**
 * calculateFinalFare
 * inputs in: distance_km (Number), pickup, drop, customerCity (string)
 * returns: { final_fare_paise, breakdown: {basePaise, competitorPaise, cityDiscountApplied}}
 */
export async function calculateFinalFare({ pickup, drop, distance_km = 0, duration_min = 0, customerCity = null }) {
  // base fare logic
  const baseFareRs = 40;
  const perKmRs = 12;
  const perMinRs = 1.5;

  const basePaise = Math.round(baseFareRs * 100 + distance_km * perKmRs * 100 + duration_min * perMinRs * 100);

  // competitor pricing - if available, use competitor kyte price (5% cheaper)
  let competitor = null;
  let kyteCandidatePaise = basePaise;

  try {
    const comp = await getCompetitorPrices(pickup, drop);
    if (comp && comp.kytePrice_paise) {
      competitor = comp.lowestCompetitor;
      kyteCandidatePaise = comp.kytePrice_paise;
    }
  } catch (e) {
    console.warn("pricingEngine: competitor fetch failed", e.message);
  }

  // Choose the minimum between system candidate and kyteCandidatePaise (defensive)
  let finalPaise = Math.min(basePaise, kyteCandidatePaise);

  // city-first-N discount (first 50 customers per city)
  let cityDiscountApplied = false;
  if (customerCity) {
    let rule = await PricingRule.findOne({ city: customerCity });
    if (rule && rule.usedCount < (rule.limit || 50)) {
      // apply 20% off
      finalPaise = Math.round(finalPaise * 0.8);
      cityDiscountApplied = true;
      // NOTE: incrementing usedCount should happen when booking confirms to avoid race (we will increment in payment route)
    }
  }

  return {
    final_fare_paise: finalPaise,
    breakdown: {
      basePaise,
      competitorPaise: competitor ? competitor.price_paise : null,
      competitorName: competitor ? competitor.name : null,
      cityDiscountApplied,
    },
  };
}
