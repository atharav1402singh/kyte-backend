// services/walletService.js
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

/* ---------------------------------------------------------
   0. Auto-create wallet
--------------------------------------------------------- */
export async function ensureWallet(ownerId, ownerType) {
  let wallet = await Wallet.findOne({ ownerId, ownerType });
  if (!wallet) {
    wallet = await Wallet.create({
      ownerId,
      ownerType,
      main_balance_paise: 0,
      rideJar_paise: 0,
      loyalty_paise: 0,
      xp: 0,
      signup_voucher_paise: 50000 // ₹500 signup bonus (USP 4 default)
    });
  }
  return wallet;
}

/* ---------------------------------------------------------
   1. CREDIT MAIN WALLET
--------------------------------------------------------- */
export async function creditWallet(ownerId, ownerType, amount, category = "main", description = "", meta = {}) {
  const wallet = await ensureWallet(ownerId, ownerType);

  wallet.main_balance_paise += Number(amount || 0);
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    amount_paise: amount,
    direction: "credit",
    category,
    description,
    meta
  });

  return wallet;
}

/* ---------------------------------------------------------
   2. DEBIT MAIN WALLET
--------------------------------------------------------- */
export async function debitWallet(ownerId, ownerType, amount, category = "main", description = "", meta = {}) {
  const wallet = await ensureWallet(ownerId, ownerType);

  if (wallet.main_balance_paise < amount) {
    throw new Error("Insufficient balance");
  }

  wallet.main_balance_paise -= Number(amount || 0);
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    amount_paise: amount,
    direction: "debit",
    category,
    description,
    meta
  });

  return wallet;
}

/* ---------------------------------------------------------
   3. ADD RIDEJAR (USP 3)
   → only customer gets rideJar
   → redeem only when ≥ ₹30 (3000 paise)
--------------------------------------------------------- */
export async function addRideJar(ownerId, ownerType, amount, description = "RideJar reward", meta = {}) {
  const wallet = await ensureWallet(ownerId, ownerType);

  wallet.rideJar_paise += Number(amount || 0);
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    amount_paise: amount,
    direction: "credit",
    category: "rideJar",
    description,
    meta
  });

  return wallet;
}

/* ---------------------------------------------------------
   4. LOYALTY (USP 8)
   → 30 paise per km
   → redeem only at ₹100 (10000 paise)
--------------------------------------------------------- */
export async function addLoyalty(ownerId, ownerType, amount, description = "Loyalty reward", meta = {}) {
  const wallet = await ensureWallet(ownerId, ownerType);

  wallet.loyalty_paise += Number(amount || 0);
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    amount_paise: amount,
    direction: "credit",
    category: "loyalty",
    description,
    meta
  });

  return wallet;
}

/* ---------------------------------------------------------
   5. XP SYSTEM (USP XP)
   → 10 XP per ride
   → redeem only when XP ≥ 100 
   → 10 XP = ₹2 → 1 XP = 20 paise
--------------------------------------------------------- */
export async function addXP(ownerId, ownerType, xp = 0, description = "XP reward", meta = {}) {
  const wallet = await ensureWallet(ownerId, ownerType);

  wallet.xp = (wallet.xp || 0) + Number(xp || 0);
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    amount_paise: 0,
    direction: "credit",
    category: "xp",
    description,
    meta: { xp_added: xp }
  });

  return wallet;
}

/* ---------------------------------------------------------
   6. REDEEM RIDEJAR
--------------------------------------------------------- */
export async function redeemRideJar(ownerId, ownerType, min = 3000) {
  const wallet = await ensureWallet(ownerId, ownerType);

  if (wallet.rideJar_paise < min) {
    throw new Error("Minimum ₹30 RideJar required");
  }

  const amount = wallet.rideJar_paise;
  wallet.rideJar_paise = 0;
  wallet.main_balance_paise += amount;
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    amount_paise: amount,
    direction: "credit",
    category: "rideJar_redeem",
    description: "RideJar → Main Balance"
  });

  return wallet;
}

/* ---------------------------------------------------------
   7. REDEEM LOYALTY
--------------------------------------------------------- */
export async function redeemLoyalty(ownerId, ownerType, min = 10000) {
  const wallet = await ensureWallet(ownerId, ownerType);

  if (wallet.loyalty_paise < min) {
    throw new Error("Minimum ₹100 Loyalty required");
  }

  const amount = wallet.loyalty_paise;
  wallet.loyalty_paise = 0;
  wallet.main_balance_paise += amount;
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    amount_paise: amount,
    direction: "credit",
    category: "loyalty_redeem",
    description: "Loyalty → Main Balance"
  });

  return wallet;
}

/* ---------------------------------------------------------
   8. REDEEM XP (100 XP → 2000 paise = ₹20)
--------------------------------------------------------- */
export async function redeemXP(ownerId, ownerType, threshold = 100, paisePerXP = 20) {
  const wallet = await ensureWallet(ownerId, ownerType);

  if (wallet.xp < threshold) {
    throw new Error("Minimum 100 XP required");
  }

  const totalXP = wallet.xp;
  const totalPaise = totalXP * paisePerXP;

  wallet.xp = 0;
  wallet.main_balance_paise += totalPaise;
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    amount_paise: totalPaise,
    direction: "credit",
    category: "xp_redeem",
    description: `${totalXP} XP → ₹${totalPaise / 100}`
  });

  return wallet;
}

/* ---------------------------------------------------------
   9. DRIVER SIGNUP VOUCHER (USP 4)
   Driver gets ₹500 "voucher" → used only after 3 rides
--------------------------------------------------------- */
export async function useSignupVoucher(driverId, amount = 2500) {
  const wallet = await ensureWallet(driverId, "driver");

  if (wallet.signup_voucher_paise < amount) {
    throw new Error("Not enough signup voucher amount");
  }

  wallet.signup_voucher_paise -= amount;
  wallet.main_balance_paise += amount;
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet._id,
    ownerId: driverId,
    ownerType: "driver",
    amount_paise: amount,
    direction: "credit",
    category: "signup_bonus",
    description: "Signup reward redeemed"
  });

  return wallet;
}
