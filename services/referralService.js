import Referral from "../models/Referral.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { updateWallet } from "./walletService.js";

// 🎯 Generate a referral code
export const createReferralCode = async (referrerId, referrerRole) => {
  if (!referrerId || !referrerRole) throw new Error("Missing referrer info");

  const code = `${referrerRole[0].toUpperCase()}${Math.floor(
    10000 + Math.random() * 90000
  )}`;
  const referral = new Referral({
    code,
    referrerId,
    referrerRole,
  });
  await referral.save();

  console.log(`🎉 Created referral code ${code} for ${referrerRole} (${referrerId})`);
  return referral;
};

// 🎯 Use a referral code when a new customer/driver joins
export const useReferralCode = async (code, refereeId, refereeRole) => {
  const referral = await Referral.findOne({ code });
  if (!referral) throw new Error("Invalid referral code");
  if (referral.status === "completed") throw new Error("Code already used");

  referral.refereeId = refereeId;
  referral.refereeRole = refereeRole;
  referral.status = "pending";
  await referral.save();

  console.log(`🔗 Referral code ${code} used by ${refereeRole} (${refereeId})`);
  return referral;
};

// 🎯 Confirm referral when the referee completes their first ride
export const confirmReferralOnFirstRide = async (customerId) => {
  const referral = await Referral.findOne({
    refereeId: customerId,
    status: "pending",
  });
  if (!referral) return null;

  console.log(
    `💸 driver→customer referral: ₹5 + ₹3`
  );

  // Referral rewards in paise
  const rewardReferrer = 500; // ₹5
  const rewardReferee = 300;  // ₹3

  // 💰 Update wallets for both
  await updateWallet(
    referral.referrerId,
    referral.referrerRole,
    "main",
    rewardReferrer,
    "Referral Bonus for inviting customer"
  );
  await updateWallet(
    referral.refereeId,
    referral.refereeRole,
    "main",
    rewardReferee,
    "Referral Bonus for joining via driver"
  );

  referral.status = "completed";
  referral.completedAt = new Date();
  referral.rewardReferrer_paise = rewardReferrer;
  referral.rewardReferee_paise = rewardReferee;
  await referral.save();

  console.log(`✅ Referral ${referral.code} marked completed and rewards credited!`);
  return referral;
};
