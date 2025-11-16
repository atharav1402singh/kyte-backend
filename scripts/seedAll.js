// scripts/seedAll.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import PricingRule from "../models/PricingRule.js";

dotenv.config();

const uri = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(uri);
  console.log("Connected");

  await PricingRule.deleteMany({});
  await Driver.deleteMany({});
  await User.deleteMany({});

  await PricingRule.create({
    city: "delhi",
    base_per_km_paise: 400,
    base_per_min_paise: 100,
    min_fare_paise: 3000,
    company_commission: 0.10,
    undercut_percent: 0.05
  });

  const user = await User.create({
  name: "Test Rider",
  phone: "9999000001",
  email: "test@kyte.com",
  password: "test123"
});

  const driver = await Driver.create({ name: "Test Driver", phone: "9999000002", vehicle_no: "DL1AB1234" });

  console.log("Seeded:", { user: user._id, driver: driver._id });
  process.exit();
}

seed().catch(e => { console.error(e); process.exit(1); });
