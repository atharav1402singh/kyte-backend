// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String },
  role: { type: String, enum: ["customer", "corporate"], default: "customer" },

  // legacy fields removed from active balance handling; wallet now holds financials
  // rideJar_balance_paise: removed (now in Wallet)
  // loyalty_balance_paise: removed (now in Wallet)

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
