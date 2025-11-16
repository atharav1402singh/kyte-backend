import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  rideId: { type: String, required: true, unique: true },

  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },

  pickup: { lat: Number, lng: Number, address: String },
  drop: { lat: Number, lng: Number, address: String },

  distance_km: Number,
  duration_min: Number,

  fare_paise: Number,

  competitor_price_paise: Number,
  final_discount_paise: Number,

  status: {
    type: String,
    enum: ["payment_pending", "requested", "assigned", "ongoing", "completed", "cancelled"],
    default: "payment_pending",
  },

  payment: {
    order_id: String,
    payment_id: String,
    signature: String,
    paid_at: Date,
  },

}, { timestamps: true });

export default mongoose.model("Ride", rideSchema);
