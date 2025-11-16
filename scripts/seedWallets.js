import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import Wallet from "../models/Wallet.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

async function seedWallets() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find();
    const drivers = await Driver.find();

    console.log(`👤 Found ${users.length} users, 🚗 ${drivers.length} drivers`);

    let createdCount = 0;

    // Create wallets for users
    for (const user of users) {
      const existing = await Wallet.findOne({ userId: user._id, role: "customer" });
      if (!existing) {
        await Wallet.create({
          userId: user._id,
          role: "customer",
          balance_paise: 0,
          rideJar_paise: 0,
          type: "main"
        });
        console.log(`🪙 Created wallet for user ${user._id}`);
        createdCount++;
      }
    }

    // Create wallets for drivers
    for (const driver of drivers) {
      const existing = await Wallet.findOne({ userId: driver._id, role: "driver" });
      if (!existing) {
        await Wallet.create({
          userId: driver._id,
          role: "driver",
          balance_paise: 0,
          rideJar_paise: 0,
          type: "main"
        });
        console.log(`🚗 Created wallet for driver ${driver._id}`);
        createdCount++;
      }
    }

    console.log(`🎉 Wallets successfully created: ${createdCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Wallet seeding failed:", err.message);
    process.exit(1);
  }
}

seedWallets();
