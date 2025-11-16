import express from "express";
const router = express.Router();

// Start Ride
router.post("/start", (req, res) => {
  const { pickup, drop, fare, distance, duration } = req.body;

  if (!pickup || !drop)
    return res.status(400).json({ success: false, message: "Missing data" });

  console.log("🚖 Ride Started:", { pickup, drop, fare, distance, duration });

  // Mock booking ID
  const rideId = "RIDE-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  res.json({
    success: true,
    rideId,
    message: "Ride booked successfully 🚕",
  });
});

// Cancel Ride
router.post("/cancel", (req, res) => {
  const { rideId } = req.body;
  console.log("❌ Ride Cancelled:", rideId);
  res.json({ success: true, message: "Ride cancelled successfully." });
});

export default router;
