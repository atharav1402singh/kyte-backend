// services/signupBonusService.js
import Driver from "../models/Driver.js";

export async function applySignupBonus(driverId) {
  const driver = await Driver.findById(driverId);
  if (!driver) return {};

  const rides = driver.completed_rides;

  let unlock = 0;

  // only AFTER 3 rides
  if (rides === 4) unlock = 2500; // 25 rupees
  if (rides === 5) unlock = 2500; // next 25 rupees

  driver.wallet_balance_paise += unlock;
  await driver.save();

  return { unlock };
}
