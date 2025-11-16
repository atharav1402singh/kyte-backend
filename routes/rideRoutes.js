// routes/rideRoutes.js
import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import Wallet from "../models/Wallet.js";

import {
  ensureWallet,
  creditWallet,
  addLoyalty,
  addXP,
  addRideJar,
} from "../services/walletService.js";

const router = express.Router();

/**
 * GET ride details
 */
router.get("/:rideId", async (req, res, next) => {
  try {
    const ride = await Ride.findOne({ rideId: req.params.rideId })
      .populate("driver customer")
      .lean();
    if (!ride) return res.status(404).json({ success: false, error: "Ride not found" });
    return res.json({ success: true, ride });
  } catch (err) {
    next(err);
  }
});

/**
 * COMPLETE RIDE (Called when DRIVER marks the ride completed)
 * Body: { rideId, rating (1-5 optional), actual_distance_km (optional), actual_duration_min (optional) }
 */
router.post("/complete", async (req, res, next) => {
  try {
    const { rideId, rating = null, actual_distance_km = null, actual_duration_min = null } = req.body;

    const ride = await Ride.findOne({ rideId });
    if (!ride) return res.status(404).json({ success: false, error: "Ride not found" });

    if (ride.status === "completed") {
      return res.json({ success: true, message: "Ride already completed" });
    }

    // calculate actual metrics (prefer reported actuals, fall back to stored)
    const distance_km = Number(actual_distance_km ?? ride.distance_km ?? 0);
    const duration_min = Number(actual_duration_min ?? ride.duration_min ?? 0);

    const fare_paise = Number(ride.fare_paise || 0);

    // fetch driver
    const driver = ride.driver ? await Driver.findById(ride.driver) : null;

    let commission_paise = 0;
    let driverShare_paise = 0;

    if (driver) {
      // Commission rule:
      // - For drivers with completed rides < 5 -> company takes 10% (driver gets 90%)
      // - For drivers with completed rides >= 5 -> company takes 3% (driver gets 97%)
      const completed = Number(driver.total_completed_rides || 0);
      const commissionRate = completed < 5 ? 0.10 : 0.03;

      commission_paise = Math.round(fare_paise * commissionRate);
      driverShare_paise = fare_paise - commission_paise;

      // Credit driver wallet (main balance)
      try {
        await creditWallet(driver._id, "driver", driverShare_paise, "ride_payment", `Payout for ${rideId}`, { rideId });
      } catch (err) {
        // non-fatal but log
        console.error("creditWallet error:", err);
      }

      // update quick fields on driver doc
      driver.wallet_balance_paise = (driver.wallet_balance_paise || 0) + driverShare_paise;
      driver.total_completed_rides = (driver.total_completed_rides || 0) + 1;

      // Signup voucher rule (USP 4):
      // if driver completes 4th or 5th ride, give ₹25 (2500 paise) as voucher balance to their wallet
      const newCompleted = driver.total_completed_rides;
      if (newCompleted === 4 || newCompleted === 5) {
        // ensure driver's wallet and add to signup_voucher_paise
        const wallet = await ensureWallet(driver._id, "driver");
        wallet.signup_voucher_paise = (wallet.signup_voucher_paise || 0) + 2500; // ₹25
        await wallet.save();
      }

      // mark driver available
      driver.status = "available";
      driver.currentRide = null;
      await driver.save();
    }

    // CUSTOMER-side rewards on completion
    if (ride.customer) {
      // ensure wallet for customer
      await ensureWallet(ride.customer, "customer");

      // Loyalty: 30 paise per km
      const loyalty_paise = Math.round(distance_km * 30);
      if (loyalty_paise > 0) {
        await addLoyalty(ride.customer, "customer", loyalty_paise, "ride_loyalty", { rideId, distance_km });
      }

      // XP: 10 XP per ride
      await addXP(ride.customer, "customer", 10, "ride_xp", { rideId });

      // RideJar: if customer rated the ride -> credit customer's rideJar (50 paise per star)
      if (rating && Number(rating) > 0) {
        const ratingStars = Number(rating);
        const rideJar_paise = ratingStars * 50; // 50 paise per star
        await addRideJar(ride.customer, "customer", rideJar_paise, "rating_reward", { rideId, rating: ratingStars });
      }
    }

    // update ride doc
    ride.status = "completed";
    ride.completed_at = new Date();
    ride.rating = rating;
    ride.actual_distance_km = distance_km;
    ride.actual_duration_min = duration_min;
    ride.commission_paise = commission_paise;
    ride.driver_share_paise = driverShare_paise;
    await ride.save();

    // socket notify
    const io = req.app.locals.io;
    io.emit("ride:completed", { rideId, driver: ride.driver, customer: ride.customer });

    return res.json({
      success: true,
      message: "Ride completed and USPs applied",
      rideId,
      driverShare_paise,
      commission_paise,
      loyalty_added_paise: Math.round(distance_km * 30),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Cancel ride (keeps older logic)
 */
router.post("/cancel", async (req, res, next) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findOne({ rideId });
    if (!ride) return res.status(404).json({ success: false, error: "Ride not found" });

    ride.status = "cancelled";
    await ride.save();

    if (ride.driver) {
      // put driver back to available
      await Driver.findByIdAndUpdate(ride.driver, { status: "available", currentRide: null });
    }

    req.app.locals.io.emit("ride:cancelled", { rideId });
    return res.json({ success: true, message: "Ride cancelled" });
  } catch (err) {
    next(err);
  }
});

export default router;
