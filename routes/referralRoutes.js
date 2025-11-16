import express from "express";
import { createReferralCode, useReferralCode } from "../services/referralService.js";

const router = express.Router();

// 🎯 Create a new referral code
router.post("/create", async (req, res) => {
  try {
    const { referrerId, referrerRole } = req.body;
    const referral = await createReferralCode(referrerId, referrerRole);
    res.json({
      success: true,
      message: "Referral code created successfully",
      referral,
    });
  } catch (err) {
    console.error("❌ Referral create error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🎯 Use a referral code (apply rewards + return wallets)
router.post("/use", async (req, res) => {
  try {
    const { code, refereeId, refereeRole } = req.body;
    const result = await useReferralCode(code, refereeId, refereeRole);

    // ✅ Directly return the result from service (don’t wrap it again!)
    return res.json(result);
  } catch (err) {
    console.error("❌ Referral use error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
