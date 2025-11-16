// models/Driver.js
import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  vehicle_no: { type: String },
  status: { type: String, enum: ["available", "onride", "offline"], default: "available" },

  // total rides completed ever
  total_completed_rides: { type: Number, default: 0 },

  // rides completed today (you can reset this via cron or daily job)
  completed_rides_today: { type: Number, default: 0 },

  // upcoming voucher tokens (500rs = 50000 paise) shown in dashboard until claimed
  signup_voucher_paise: { type: Number, default: 0 },

  // wallet balance accessible via Wallet model, keep for quick reference if desired
  wallet_balance_paise: { type: Number, default: 0 },

  // last known location
  lastLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Driver", DriverSchema);
