// routes/walletRoutes.js
import express from "express";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import User from "../models/User.js";

import {
  ensureWallet,
  creditWallet,
  debitWallet,
  addLoyalty,
  addXP,
  addRideJar,
} from "../services/walletService.js";

const router = express.Router();

/* ---------------------------------------------------------
      GET FULL WALLET BALANCE (All wallets)
--------------------------------------------------------- */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await ensureWallet(userId, "customer");

    const wallet = await Wallet.findOne({ userId }).lean();
    if (!wallet)
      return res.status(404).json({ success: false, msg: "Wallet not found" });

    res.json({
      success: true,
      balance: {
        main: wallet.balance_paise / 100,
        rideJar: wallet.rideJar_paise / 100,
        loyalty: wallet.loyalty_paise / 100,
        xp: wallet.xp_points || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------
      TRANSACTION HISTORY
--------------------------------------------------------- */
router.get("/history/:userId", async (req, res) => {
  try {
    const tx = await WalletTransaction.find({ ownerId: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, history: tx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------
      REDEEM XP → converts XP → money into wallet
      RULE: 100 XP = ₹20 redeemable (USP XP)
--------------------------------------------------------- */
router.post("/redeem/xp/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await ensureWallet(userId, "customer");

    const wallet = await Wallet.findOne({ userId });
    const xp = wallet.xp_points || 0;

    if (xp < 100)
      return res.json({
        success: false,
        msg: "Minimum 100 XP required (100 XP = ₹20)",
      });

    const redeemableAmount = Math.floor(xp / 100) * 20 * 100; // paise
    const xpUsed = Math.floor(xp / 100) * 100;

    // deduct XP
    wallet.xp_points -= xpUsed;
    wallet.balance_paise += redeemableAmount;
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet._id,
      ownerId: userId,
      ownerType: "customer",
      amount_paise: redeemableAmount,
      transactionType: "credit",
      type: "main",
      description: `Redeemed ${xpUsed} XP`,
    });

    res.json({
      success: true,
      redeemed_rs: redeemableAmount / 100,
      xp_used: xpUsed,
      message: "XP redeemed successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------
      REDEEM LOYALTY MONEY
      RULE: customer can redeem only after ₹100 collected
--------------------------------------------------------- */
router.post("/redeem/loyalty/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await ensureWallet(userId, "customer");
    const wallet = await Wallet.findOne({ userId });

    if (wallet.loyalty_paise < 10000)
      return res.json({
        success: false,
        msg: "You need minimum ₹100 loyalty balance",
      });

    const amount = wallet.loyalty_paise;

    wallet.loyalty_paise = 0;
    wallet.balance_paise += amount;
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet._id,
      ownerId: userId,
      ownerType: "customer",
      amount_paise: amount,
      transactionType: "credit",
      type: "loyalty",
      description: "Loyalty redeemed",
    });

    res.json({ success: true, redeemed_rs: amount / 100 });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------
      REDEEM RIDEJAR (USP 3)
      RULE: customer needs ₹30 minimum (3000 paise)
--------------------------------------------------------- */
router.post("/redeem/ridejar/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await ensureWallet(userId, "customer");
    const wallet = await Wallet.findOne({ userId });

    if (wallet.rideJar_paise < 3000)
      return res.json({
        success: false,
        msg: "Minimum RideJar balance ₹30 required",
      });

    const amount = wallet.rideJar_paise;

    wallet.rideJar_paise = 0;
    wallet.balance_paise += amount;
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet._id,
      ownerId: userId,
      ownerType: "customer",
      amount_paise: amount,
      transactionType: "credit",
      type: "rideJar",
      description: "RideJar redeemed",
    });

    res.json({ success: true, redeemed_rs: amount / 100 });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

export default router;
