// models/PricingRule.js
import mongoose from "mongoose";

const PricingRuleSchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },
  limit: { type: Number, default: 50 }, // first N customers
  usedCount: { type: Number, default: 0 },
});

export default mongoose.model("PricingRule", PricingRuleSchema);
