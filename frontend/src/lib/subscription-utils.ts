// Centralized subscription plan detection utilities

export interface SubscriptionData {
  price_id?: string | null;
  plan_name?: string | null;
  status?: string | null;
  cost_limit?: number | null;
}

// Official Stripe price IDs for each plan
export const PLAN_PRICE_IDS = {
  pro: [
    'price_1RqK0hFNfWjTbEjsaAFuY7Cb', // Pro Monthly
    'price_1RqK0hFNfWjTbEjsN9XCGLA4', // Pro Yearly
  ],
  proMax: [
    'price_1RqK4xFNfWjTbEjsCrjfvJVL', // Pro Max Monthly  
    'price_1RqK6cFNfWjTbEjs75UPIgif', // Pro Max Yearly
  ],
};

// Check if user has an active subscription (Pro or higher)
export const hasActiveSubscription = (subscriptionData: SubscriptionData | null | undefined): boolean => {
  if (!subscriptionData) return false;
  
  // Check if status is active
  if (subscriptionData.status === 'active' || subscriptionData.status === 'trialing') {
    return true;
  }
  
  // Check if has a Pro or Pro Max price_id
  if (subscriptionData.price_id) {
    const allProPriceIds = [...PLAN_PRICE_IDS.pro, ...PLAN_PRICE_IDS.proMax];
    if (allProPriceIds.includes(subscriptionData.price_id)) {
      return true;
    }
  }
  
  // Check legacy plan names
  if (subscriptionData.plan_name === 'base' || subscriptionData.plan_name === 'extra') {
    return true;
  }
  
  // Check cost limit as fallback for manual assignments
  if (subscriptionData.cost_limit && subscriptionData.cost_limit > 5) {
    return true;
  }
  
  // Fallback: If there's ANY price_id set (even custom ones from CLI assignments)
  // and it's not explicitly a free plan, consider it as having subscription
  if (subscriptionData.price_id && subscriptionData.price_id !== '') {
    // Only return false if we're sure it's a free plan
    if (subscriptionData.plan_name === 'free' && (subscriptionData.cost_limit || 0) <= 5) {
      return false;
    }
    // Otherwise assume they have access
    return true;
  }
  
  return false;
};

// Get the display name of the current plan
export const getPlanDisplayName = (subscriptionData: SubscriptionData | null | undefined): string => {
  if (!subscriptionData) return 'Gratuito';
  
  // Check new price IDs first
  if (subscriptionData.price_id) {
    if (PLAN_PRICE_IDS.pro.includes(subscriptionData.price_id)) return 'Pro';
    if (PLAN_PRICE_IDS.proMax.includes(subscriptionData.price_id)) return 'Pro Max';
  }
  
  // Check legacy plan names
  if (subscriptionData.plan_name === 'base') return 'Pro';
  if (subscriptionData.plan_name === 'extra') return 'Pro Max';
  if (subscriptionData.plan_name === 'enterprise') return 'Enterprise';
  
  // Check if there's an active subscription even without matching price_id
  if (subscriptionData.status === 'active' || subscriptionData.status === 'trialing') {
    const costLimit = subscriptionData.cost_limit || 0;
    if (costLimit >= 400) return 'Pro Max';
    if (costLimit > 5) return 'Pro';
  }
  
  // Fallback: If there's ANY price_id set (even custom ones from CLI)
  if (subscriptionData.price_id && subscriptionData.price_id !== '') {
    // Check by plan_name and cost_limit
    if (subscriptionData.plan_name === 'free' && (subscriptionData.cost_limit || 0) <= 5) {
      return 'Gratuito';
    }
    // Otherwise assume at least Pro based on cost limit
    const costLimit = subscriptionData.cost_limit || 0;
    if (costLimit >= 400) return 'Pro Max';
    return 'Pro';
  }
  
  return 'Gratuito';
};

// Check if user has a specific plan
export const hasPlan = (
  subscriptionData: SubscriptionData | null | undefined,
  planName: 'free' | 'pro' | 'pro_max' | 'enterprise'
): boolean => {
  if (!subscriptionData) return planName === 'free';
  
  const currentPlan = getPlanDisplayName(subscriptionData).toLowerCase().replace(' ', '_');
  
  if (planName === 'free') {
    return currentPlan === 'gratuito' || !hasActiveSubscription(subscriptionData);
  }
  
  if (planName === 'pro') {
    return currentPlan === 'pro';
  }
  
  if (planName === 'pro_max') {
    return currentPlan === 'pro_max';
  }
  
  if (planName === 'enterprise') {
    return currentPlan === 'enterprise';
  }
  
  return false;
};