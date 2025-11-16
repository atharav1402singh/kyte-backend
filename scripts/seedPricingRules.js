// scripts/seedPricingRules.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import PricingRule from "../models/PricingRule.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const CITIES = [
  { city: "New Delhi", limit: 50 },
  { city: "Noida", limit: 50 },
  { city: "Gurgaon", limit: 50 },
  { city: "Mumbai", limit: 50 },
  { city: "Bengaluru", limit: 50 },
];

async function main() {
  if (!MONGO_URI) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB");

  for (const c of CITIES) {
    const existing = await PricingRule.findOne({ city: c.city });
    if (existing) {
      existing.limit = c.limit;
      existing.usedCount = existing.usedCount || 0;
      await existing.save();
      console.log("Updated rule:", c.city);
    } else {
      await PricingRule.create({ city: c.city, limit: c.limit, usedCount: 0 });
      console.log("Created rule:", c.city);
    }
  }

  console.log("Done seeding pricing rules.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
