// routes/userRoutes.js

import express from "express";
import User from "../models/User.js";

const router = express.Router();

/* ----------------------------------------------------
   PUBLIC: create user (no auth required)
----------------------------------------------------- */
router.post("/create", async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const user = await User.create({
      name,
      phone,
      email,
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error("User create error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/* ----------------------------------------------------
   PUBLIC: get user by ID
----------------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("User fetch error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
