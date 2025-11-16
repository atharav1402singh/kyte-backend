// scripts/seedPricing.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import PricingRule from "../models/PricingRule.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const seedPricing = async () => {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected!");

    const rules = [
      {
        city: "delhi",
        base_per_km_paise: 400, // ₹4 per km
        base_per_min_paise: 100, // ₹1 per minute
        min_fare_paise: 3000, // ₹30 minimum fare
        company_commission: 0.1, // 10%
        undercut_percent: 0.05, // 5% undercut
      },
    ];

    await PricingRule.deleteMany({});
    console.log("🗑️ Old pricing rules deleted.");

    await PricingRule.insertMany(rules);
    console.log("🌆 New pricing rules inserted:", rules);

    console.log("✅ Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error while seeding:", err);
    process.exit(1);
  }
};

seedPricing();
