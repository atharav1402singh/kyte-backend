// services/commissionService.js
export function calculateCompanyCommission(driverCompletedRides, fare_paise) {
  if (driverCompletedRides < 5) {
    return Math.round(fare_paise * 0.10); // company takes 10%
  } else {
    return Math.round(fare_paise * 0.03); // company takes 3%
  }
}

export function calculateDriverEarnings(driverCompletedRides, fare_paise) {
  if (driverCompletedRides < 5) {
    return Math.round(fare_paise * 0.90);
  } else {
    return Math.round(fare_paise * 0.97);
  }
}
