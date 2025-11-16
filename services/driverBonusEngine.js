// services/driverBonusEngine.js
import Driver from "../models/Driver.js";

/**
 * calculateCommissionRates
 * @param {Number} driverCompletedRides
 * @returns {Object} {companyCommissionPaise, driverEarningPaise} given farePaise param
 */
export function calcCommissionForFare(driverCompletedRides, farePaise) {
  // before completing 5 rides => company takes 10%
  // after 5 rides (i.e., completed_rides >= 5) => company takes 3%
  const companyPercent = driverCompletedRides < 5 ? 0.10 : 0.03;
  const companyPaise = Math.round(farePaise * companyPercent);
  const driverPaise = farePaise - companyPaise;
  return { companyPaise, driverPaise, companyPercent };
}

/**
 * applySignupProgression
 * Called when driver.completed_rides increases; unlocks 25rs at 4th and 25rs at 5th ride,
 * but only if driver completed >=4 and >3 rides in a day? (Your rule: if driver only complete 3 rides or less in a day then they will not get any 25rs)
 * We will implement per-driver total completed rides (global) and also check ridesToday if you want later.
 */
export async function applySignupBonusIfEligible(driverId) {
  const driver = await Driver.findById(driverId);
  if (!driver) return { unlockedPaise: 0, reason: "driver not found" };

  const unlocked = { unlockedPaise: 0, reason: null };

  // Only allow unlock when overall completed_rides >=4 or 5
  // and ensure we don't double-credit: use bonus_tokens_remaining_paise tracking
  try {
    // if 4th ride just reached and remaining includes enough
    if (driver.completed_rides === 4 && driver.bonus_tokens_remaining_paise >= 2500) {
      driver.wallet_balance_paise += 2500;
      driver.bonus_tokens_remaining_paise -= 2500;
      unlocked.unlockedPaise = 2500;
      unlocked.reason = "4th ride bonus";
    } else if (driver.completed_rides === 5 && driver.bonus_tokens_remaining_paise >= 2500) {
      driver.wallet_balance_paise += 2500;
      driver.bonus_tokens_remaining_paise -= 2500;
      unlocked.unlockedPaise = 2500;
      unlocked.reason = "5th ride bonus";
    }
    await driver.save();
  } catch (e) {
    console.error("applySignupBonusIfEligible", e.message);
  }

  return unlocked;
}
