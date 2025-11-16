// routes/paymentRoutes.js
import express from "express";
import crypto from "crypto";

import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import PricingRule from "../models/PricingRule.js";

import { ensureWallet } from "../services/walletService.js";
import { findNearestAvailableDriver } from "../services/driverMatcher.js";
import { calculateFare } from "../services/fareCalculator.js";

const router = express.Router();

/* ------------------------------------------------------------
    CREATE ORDER
------------------------------------------------------------- */
router.post("/create-order", async (req, res) => {
  try {
    const razorpay = req.app.locals.razorpay;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: "Valid amount required" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "kyte_order_" + Date.now(),
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ success: false, error: "Order creation failed" });
  }
});

/* ------------------------------------------------------------
    VERIFY PAYMENT → CREATE RIDE → APPLY USPs → ASSIGN DRIVER
------------------------------------------------------------- */
router.post("/verify", async (req, res, next) => {
  try {
    const { order_id, payment_id, signature, customerId, rideMeta, city } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    /* 🔐 VERIFY SIGNATURE */
    const expected = crypto
      .createHmac("sha256", secret)
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    /* 🆔 Generate Ride ID */
    const rideId = "RIDE-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    /* 💸 Calculate final fare using USPs */
    const fareInfo = await calculateFare({
      pickup: rideMeta.pickup,
      drop: rideMeta.drop,
      distance_km: rideMeta.distance_km,
      customerCity: city,
    });

    const finalFare_rupees = fareInfo.final_fare;
    const finalFare_paise = finalFare_rupees * 100;

    /* 👛 Ensure customer wallet exists */
    if (customerId) {
      await ensureWallet(customerId, "customer");
    }

    /* 🚌 Create ride (initial state = payment_pending) */
    const ride = await Ride.create({
      rideId,
      customer: customerId || null,
      pickup: rideMeta.pickup,
      drop: rideMeta.drop,
      distance_km: rideMeta.distance_km,
      duration_min: rideMeta.duration_min,
      fare_paise: finalFare_paise,
      pricing: fareInfo,
      status: "payment_pending",
      payment: {
        order_id,
        payment_id,
        signature,
        paid_at: new Date(),
      },
    });

    /* 🎁 USP: First 50 users per city (20% off logic recorded in fareCalculator) */
    if (city) {
      const rule = await PricingRule.findOne({ city });
      if (rule && rule.first50Left > 0) {
        rule.first50Left -= 1;
        await rule.save();
      }
    }

    /* 🚗 Assign nearest driver */
    const nearestDriver = await findNearestAvailableDriver(
      rideMeta.pickup.lat,
      rideMeta.pickup.lng
    );

    if (nearestDriver) {
      const d = await Driver.findById(nearestDriver._id);
      d.status = "onride";
      d.currentRide = ride._id;
      await d.save();

      ride.driver = d._id;
      ride.status = "assigned";
      await ride.save();

      const io = req.app.locals.io;
      io.to(`driver_${d._id}`).emit("ride:assigned", { rideId, ride });
    }

    return res.json({ success: true, ride, fareInfo });
  } catch (err) {
    next(err);
  }
});

export default router;
