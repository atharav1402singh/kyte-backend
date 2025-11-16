// services/competitorFeed.js
/**
 * Mock competitor feed generator
 * This simulates current prices from Ola, Uber, Rapido dynamically.
 * Later, we can switch to real-time scraping or API fetching easily.
 */

export async function getCompetitorLowestFare({ city, distance_km }) {
  // Simulate competitor price in paise (1 INR = 100 paise)
  // Base on some pseudo-random pattern for realism
  const baseRates = {
    delhi: { ola: 2200, uber: 2100, rapido: 2000 },
    noida: { ola: 2400, uber: 2300, rapido: 2200 },
    gurgaon: { ola: 2600, uber: 2550, rapido: 2450 },
  };

  const current = baseRates[city.toLowerCase()] || baseRates["delhi"];

  // Simulate per km variance
  const multiplier = distance_km / 10;
  const competitors = {
    ola: Math.round(current.ola * multiplier),
    uber: Math.round(current.uber * multiplier),
    rapido: Math.round(current.rapido * multiplier),
  };

  const lowest = Math.min(...Object.values(competitors));

  console.log(`📊 Mock Competitor Feed for ${city}:`, competitors, "→ Lowest:", lowest);
  return lowest; // return lowest fare in paise
}
