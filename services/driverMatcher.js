// services/driverMatcher.js
import Driver from "../models/Driver.js";

/**
 * findNearestAvailableDriver(lat, lng)
 * simple nearest by squared euclidean (works for small areas; replace with proper haversine for production)
 * returns driver doc or null
 */
export async function findNearestAvailableDriver(lat, lng) {
  try {
    const drivers = await Driver.find({ status: "available" }).lean();

    let closest = null;
    let bestScore = Infinity;

    for (const d of drivers) {
      if (!d.lastLocation || typeof d.lastLocation.lat !== "number" || typeof d.lastLocation.lng !== "number") continue;
      const dx = d.lastLocation.lat - lat;
      const dy = d.lastLocation.lng - lng;
      const score = dx * dx + dy * dy;
      if (score < bestScore) {
        bestScore = score;
        closest = d;
      }
    }

    return closest;
  } catch (err) {
    console.error("Driver matcher error:", err);
    return null;
  }
}
