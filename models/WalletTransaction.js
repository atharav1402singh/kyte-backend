// models/WalletTransaction.js
import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  ownerType: { type: String, enum: ["driver", "customer", "corporate"], required: true },

  amount_paise: { type: Number, required: true }, // positive value
  direction: { type: String, enum: ["credit", "debit"], required: true }, // credit => added to wallet, debit => removed

  // business type
  category: {
    type: String,
    enum: [
      "ride_payment",
      "commission",
      "rideJar",
      "loyalty",
      "xp_redeem",
      "signup_bonus",
      "admin_credit",
      "refund",
      "other",
    ],
    default: "other",
  },

  description: { type: String, default: "" },

  meta: { type: mongoose.Schema.Types.Mixed }, // optional metadata (rideId, orderId, etc.)

  createdAt: { type: Date, default: Date.now },
});

const WalletTransaction =
  mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);

export default WalletTransaction;
