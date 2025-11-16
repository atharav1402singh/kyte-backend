// routes/driverRoutes.js
import express from "express";
import Driver from "../models/Driver.js";

const router = express.Router();

// register driver
router.post("/create", async (req, res) => {
  try {
    const { name, phone, vehicle_no } = req.body;
    const driver = await Driver.create({ name, phone, vehicle_no });
    res.json({ success: true, driver });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// driver sets last GPS location
router.post("/:id/location", async (req, res) => {
  const { lat, lng } = req.body;
  await Driver.findByIdAndUpdate(req.params.id, {
    lastLocation: { lat, lng }
  });
  res.json({ success: true });
});

// driver becomes available
router.post("/:id/available", async (req, res) => {
  await Driver.findByIdAndUpdate(req.params.id, {
    status: "available",
    currentRide: null,
  });
  res.json({ success: true });
});

export default router;
