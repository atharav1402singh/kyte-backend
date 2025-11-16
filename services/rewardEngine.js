// services/rewardEngine.js
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

/**
 * rewardDriverByRating
 * rating: integer 1..5
 * driverId: mongoose id
 * Rules per your update: driver gets reward amount; customer does not receive anything here.
 * Driver receives 50 paise per star (so rating 5 → 250 paise)
 */
export async function rewardDriverByRating(driverId, rating, rideId = null) {
  if (!driverId || !rating) return 0;
  const amountPaise = Math.round(rating * 50);

  // find or create wallet for driver (ownerType: driver)
  let wallet = await Wallet.findOne({ ownerId: driverId, ownerType: "driver" });
  if (!wallet) {
    wallet = await Wallet.create({
      ownerId: driverId,
      ownerType: "driver",
      main_balance_paise: 0,
      rideJar_paise: 0,
      loyalty_xp: 0,
    });
  }

  // Credit to driver's main balance
  wallet.main_balance_paise += amountPaise;
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId: driverId,
    ownerType: "driver",
    amount_paise: amountPaise,
    transactionType: "credit",
    type: "main",
    description: `Rating reward for ride ${rideId || "N/A"}`,
  });

  return amountPaise;
}
