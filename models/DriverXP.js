import mongoose from "mongoose";

const driverXpSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  rideId: { type: String },
  xp_earned: Number,
}, { timestamps: true });

export default mongoose.model("DriverXP", driverXpSchema);
