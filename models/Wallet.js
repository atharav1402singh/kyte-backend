// models/Wallet.js
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // user or driver id
    ownerType: { type: String, enum: ["customer", "driver", "corporate"], required: true },

    // money values stored in paise (integers)
    main_balance_paise: { type: Number, default: 0 }, // withdrawable / payable balance
    rideJar_paise: { type: Number, default: 0 }, // rideJar earned via ratings / promotions
    loyalty_paise: { type: Number, default: 0 }, // loyalty earned per km, redeemable after threshold

    // XP system (integer XP)
    xp: { type: Number, default: 0 }, // e.g., 10 XP per ride

    // signup voucher pool for drivers (non-withdrawable until claimed by admin/flow)
    signup_voucher_paise: { type: Number, default: 0 },

    // meta
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
