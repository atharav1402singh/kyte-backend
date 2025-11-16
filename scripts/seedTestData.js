// scripts/seedTestData.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import Wallet from "../models/Wallet.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

async function main() {
  if (!MONGO_URI) { console.error("MONGO_URI missing"); process.exit(1); }
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected");

  // Create / find test user
  const user = await User.findOneAndUpdate(
    { phone: "9999999999" },
    { name: "Test User", phone: "9999999999", email: "test@kyte.app" },
    { upsert: true, new: true }
  );
  console.log("User:", user._id);

  // Create / find test driver with 500 token (as upcoming bonus)
  const driver = await Driver.findOneAndUpdate(
    { phone: "8888888888" },
    {
      name: "Test Driver",
      phone: "8888888888",
      vehicle_no: "DL1AB1234",
      completed_rides: 0,
      bonus_tokens_remaining_paise: 50000, // 500 rs in paise as upcoming voucher
      wallet_balance_paise: 0,
      status: "available"
    },
    { upsert: true, new: true }
  );
  console.log("Driver:", driver._id);

  // Create wallets
  await Wallet.findOneAndUpdate(
    { ownerId: user._id },
    { ownerId: user._id, ownerType: "customer", main_balance_paise: 50000, rideJar_paise: 0, loyalty_xp: 0 },
    { upsert: true }
  );
  await Wallet.findOneAndUpdate(
    { ownerId: driver._id },
    { ownerId: driver._id, ownerType: "driver", main_balance_paise: 0, rideJar_paise: 0 },
    { upsert: true }
  );

  console.log("Seeded test data. User phone 9999999999, Driver phone 8888888888");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
