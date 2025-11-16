// models/CompetitorPrice.js
import mongoose from "mongoose";

const CompetitorPriceSchema = new mongoose.Schema({
  routeKey: { type: String, required: true }, // e.g., "city|lat1,lng1|lat2,lng2"
  prices: [{
    source: String,
    price_paise: Number
  }],
  minPrice_paise: { type: Number, default: null },
  updatedAt: { type: Date, default: Date.now }
});

CompetitorPriceSchema.index({ routeKey: 1 }, { unique: true });

export default mongoose.model("CompetitorPrice", CompetitorPriceSchema);
