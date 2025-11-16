// services/rideJarService.js
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";

export async function rewardRideJar(customerId, rating) {
  if (!customerId) return;

  const rewardPaise = Math.round(rating * 50); // 50 paise per star

  const wallet = await Wallet.findOne({ userId: customerId, type: "rideJar" });
  if (!wallet) return;

  wallet.rideJar_paise += rewardPaise;
  await wallet.save();

  return rewardPaise;
}
