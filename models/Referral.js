import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // can be User or Driver
    required: true,
  },
  referrerRole: {
    type: String,
    enum: ["driver", "customer"],
    required: true,
  },
  refereeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  refereeRole: {
    type: String,
    enum: ["driver", "customer", null],
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  rewardReferrer_paise: {
    type: Number,
    default: 0,
  },
  rewardReferee_paise: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

// ✅ Prevent model overwrite error
const Referral =
  mongoose.models.Referral || mongoose.model("Referral", referralSchema);

export default Referral;
