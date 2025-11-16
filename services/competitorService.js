// services/competitorService.js
// Mock competitor integration: returns rupee values and kyte suggestion
import CompetitorPrice from "../models/CompetitorPrice.js";

/**
 * getCompetitorPrices(pickup, drop)
 * returns { lowestPrice: number (rupees), lowestCompetitor: {name,price}, kyteSuggestedFare: number (rupees) }
 */
export async function getCompetitorPrices(pickup, drop) {
  try {
    // === MOCKED PRICES ===
    const mocked = [
      { name: "rapido", price: 110 },
      { name: "ola", price: 120 },
      { name: "uber", price: 115 },
    ];

    const lowest = mocked.reduce((acc, v) => (v.price < acc.price ? v : acc), mocked[0]);

    const lowestPrice = lowest.price; // rupees
    const kyteSuggestedFare = Math.round(lowestPrice * 0.95); // 5% cheaper

    // store short analytics (non-critical)
    try {
      await CompetitorPrice.create({
        source: lowest.name,
        pickup,
        drop,
        price_paise: Math.round(lowestPrice * 100),
      });
    } catch (e) {
      // nonfatal
    }

    return {
      lowestPrice,
      lowestCompetitor: { name: lowest.name, price: lowest.price },
      kyteSuggestedFare,
    };
  } catch (err) {
    console.error("Competitor Service Error:", err);
    return null;
  }
}
