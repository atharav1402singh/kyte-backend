// services/xpService.js
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";

/**
 * addXPForRide
 * Adds 10 XP per ride to user.loyalty_xp and to wallet.loyalty_xp for quick read.
 * Returns new XP value.
 */
export async function addXPForRide(userId) {
  if (!userId) return 0;
  const user = await User.findById(userId);
  if (!user) return 0;

  user.loyalty_xp = (user.loyalty_xp || 0) + 10;
  await user.save();

  // update wallet record too
  let wallet = await Wallet.findOne({ ownerId: userId, ownerType: "customer" });
  if (!wallet) {
    wallet = await Wallet.create({
      ownerId: userId,
      ownerType: "customer",
      main_balance_paise: 0,
      rideJar_paise: 0,
      loyalty_xp: user.loyalty_xp,
    });
  } else {
    wallet.loyalty_xp = user.loyalty_xp;
    await wallet.save();
  }

  return user.loyalty_xp;
}

/**
 * redeemXP
 * 10 XP = ₹2 ; user can redeem only when xp >= 100 (gives ₹20)
 * This moves funds into user's main balance (paise) and resets XP accordingly.
 */
export async function redeemXP(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if ((user.loyalty_xp || 0) < 100) {
    return { success: false, message: "Not enough XP" };
  }

  // calculate number of 100-XP chunks
  const chunks = Math.floor(user.loyalty_xp / 100);
  const amountPaise = chunks * 2000; // ₹20 -> 2000 paise per 100 XP

  user.loyalty_xp -= chunks * 100;
  await user.save();

  // credit to wallet main balance
  let wallet = await Wallet.findOne({ ownerId: userId, ownerType: "customer" });
  if (!wallet) {
    wallet = await Wallet.create({
      ownerId: userId,
      ownerType: "customer",
      main_balance_paise: amountPaise,
      rideJar_paise: 0,
      loyalty_xp: user.loyalty_xp,
    });
  } else {
    wallet.main_balance_paise += amountPaise;
    wallet.loyalty_xp = user.loyalty_xp;
    await wallet.save();
  }

  return { success: true, amountPaise, xpRemaining: user.loyalty_xp };
}
