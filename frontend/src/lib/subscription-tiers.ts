import { config } from './config';

// New subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    priceId: config.SUBSCRIPTION_TIERS.FREE.priceId,
  },
  PRO: {
    priceId: 'price_1RqK0hFNfWjTbEjsaAFuY7Cb',  // Monthly
    yearlyPriceId: 'price_1RqK0hFNfWjTbEjsN9XCGLA4',  // Yearly
  },
  PRO_MAX: {
    priceId: 'price_1RqK4xFNfWjTbEjsCrjfvJVL',  // Monthly
    yearlyPriceId: 'price_1RqK6cFNfWjTbEjs75UPIgif',  // Yearly
  },
  // Legacy tiers for backwards compatibility
  TIER_2_20: config.SUBSCRIPTION_TIERS.TIER_2_20,
  TIER_6_50: config.SUBSCRIPTION_TIERS.TIER_6_50,
  TIER_12_100: config.SUBSCRIPTION_TIERS.TIER_12_100,
  TIER_25_200: config.SUBSCRIPTION_TIERS.TIER_25_200,
  TIER_50_400: config.SUBSCRIPTION_TIERS.TIER_50_400,
  TIER_125_800: config.SUBSCRIPTION_TIERS.TIER_125_800,
  TIER_200_1000: config.SUBSCRIPTION_TIERS.TIER_200_1000,
};

export default SUBSCRIPTION_TIERS;