import { backendApi } from '../api-client';

export interface CreditBalanceV2 {
  balance: number;
  expiring_credits: number;
  non_expiring_credits: number;
  tier: string;
  next_credit_grant?: string;
  can_purchase_credits: boolean;
  breakdown?: {
    expiring: number;
    non_expiring: number;
    total: number;
  };
  lifetime_granted?: number;
  lifetime_purchased?: number;
  lifetime_used?: number;
}

export interface SubscriptionInfoV2 {
  status: string;
  plan_name: string;
  price_id: string;
  subscription: {
    id: string;
    status: string;
    price_id: string;
    current_period_end: string;
    cancel_at?: string;
    canceled_at?: string;
  } | null;
  tier: {
    name: string;
    credits: number;
  };
  credits: {
    balance: number;
    tier_credits: number;
    lifetime_granted: number;
    lifetime_purchased: number;
    lifetime_used: number;
    can_purchase_credits: boolean;
  };
}

export interface BillingStatusV2 {
  can_run: boolean;
  balance: number;
  tier: string;
  message: string;
}

export interface TokenUsageV2 {
  prompt_tokens: number;
  completion_tokens: number;
  model: string;
  thread_id?: string;
  message_id?: string;
}

export interface DeductResultV2 {
  success: boolean;
  cost: number;
  new_balance: number;
  transaction_id?: string;
}

export interface TransactionV2 {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface TransactionsResponseV2 {
  transactions: TransactionV2[];
  count: number;
}

export interface UsageHistoryV2 {
  daily_usage: Record<
    string,
    {
      credits: number;
      debits: number;
      count: number;
    }
  >;
  total_period_usage: number;
  total_period_credits: number;
}

export interface CreateCheckoutSessionRequestV2 {
  price_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutSessionResponseV2 {
  checkout_url?: string;
  success?: boolean;
  subscription_id?: string;
  message?: string;
}

export interface CreatePortalSessionRequestV2 {
  return_url: string;
}

export interface CreatePortalSessionResponseV2 {
  portal_url: string;
}

export interface PurchaseCreditsRequestV2 {
  amount: number;
  success_url: string;
  cancel_url: string;
}

export interface PurchaseCreditsResponseV2 {
  checkout_url: string;
}

export interface CancelSubscriptionRequestV2 {
  feedback?: string;
}

export interface CancelSubscriptionResponseV2 {
  success: boolean;
  cancel_at: number;
  message: string;
}

export interface ReactivateSubscriptionResponseV2 {
  success: boolean;
  message: string;
}

export interface TestRenewalResponseV2 {
  success: boolean;
  message?: string;
  credits_granted?: number;
  new_balance?: number;
}

export interface TrialStatusV2 {
  has_trial: boolean;
  trial_status?: 'none' | 'active' | 'expired' | 'converted' | 'cancelled' | 'used';
  trial_started_at?: string;
  trial_ends_at?: string;
  trial_mode?: string;
  remaining_days?: number;
  credits_remaining?: number;
  tier?: string;
  can_start_trial?: boolean;
  message?: string;
  trial_history?: {
    started_at?: string;
    ended_at?: string;
    converted_to_paid?: boolean;
  };
}

export interface TrialStartRequestV2 {
  success_url: string;
  cancel_url: string;
}

export interface TrialStartResponseV2 {
  checkout_url: string;
  session_id: string;
}

export interface TrialCheckoutRequestV2 {
  success_url: string;
  cancel_url: string;
}

export interface TrialCheckoutResponseV2 {
  checkout_url: string;
  session_id: string;
}

export const billingApiV2 = {
  async getSubscription() {
    const response = await backendApi.get<SubscriptionInfoV2>('/billing/subscription');
    if (response.error) throw response.error;
    return response.data!;
  },

  async checkBillingStatus() {
    const response = await backendApi.post<BillingStatusV2>('/billing/check');
    if (response.error) throw response.error;
    return response.data!;
  },

  async getCreditBalance() {
    const response = await backendApi.get<CreditBalanceV2>('/billing/balance');
    if (response.error) throw response.error;
    return response.data!;
  },

  async deductTokenUsage(usage: TokenUsageV2) {
    const response = await backendApi.post<DeductResultV2>('/billing/deduct', usage);
    if (response.error) throw response.error;
    return response.data!;
  },

  async createCheckoutSession(request: CreateCheckoutSessionRequestV2) {
    const response = await backendApi.post<CreateCheckoutSessionResponseV2>(
      '/billing/create-checkout-session',
      request,
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  async createPortalSession(request: CreatePortalSessionRequestV2) {
    const response = await backendApi.post<CreatePortalSessionResponseV2>(
      '/billing/create-portal-session',
      request,
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  async cancelSubscription(request?: CancelSubscriptionRequestV2) {
    const response = await backendApi.post<CancelSubscriptionResponseV2>(
      '/billing/cancel-subscription',
      request ?? {},
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  async reactivateSubscription() {
    const response = await backendApi.post<ReactivateSubscriptionResponseV2>(
      '/billing/reactivate-subscription',
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  async purchaseCredits(request: PurchaseCreditsRequestV2) {
    const response = await backendApi.post<PurchaseCreditsResponseV2>(
      '/billing/purchase-credits',
      request,
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  async getTransactions(limit = 50, offset = 0) {
    const response = await backendApi.get<TransactionsResponseV2>(
      `/billing/transactions?limit=${limit}&offset=${offset}`,
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  async getUsageHistory(days = 30) {
    const response = await backendApi.get<UsageHistoryV2>(
      `/billing/usage-history?days=${days}`,
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  async triggerTestRenewal() {
    const response = await backendApi.post<TestRenewalResponseV2>('/billing/test/trigger-renewal');
    if (response.error) throw response.error;
    return response.data!;
  },

  async getTrialStatus() {
    const response = await backendApi.get<TrialStatusV2>('/billing/trial/status');
    if (response.error) throw response.error;
    return response.data!;
  },

  async startTrial(request: TrialStartRequestV2) {
    const response = await backendApi.post<TrialStartResponseV2>('/billing/trial/start', request);
    if (response.error) throw response.error;
    return response.data!;
  },

  async createTrialCheckout(request: TrialCheckoutRequestV2) {
    const response = await backendApi.post<TrialCheckoutResponseV2>(
      '/billing/trial/create-checkout',
      request,
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  async cancelTrial() {
    const response = await backendApi.post<{ success: boolean; message: string; subscription_status: string }>(
      '/billing/trial/cancel',
      {},
    );
    if (response.error) throw response.error;
    return response.data!;
  },
};

export const getSubscription = () => billingApiV2.getSubscription();
export const checkBillingStatus = () => billingApiV2.checkBillingStatus();
export const getCreditBalance = () => billingApiV2.getCreditBalance();
export const deductTokenUsage = (usage: TokenUsageV2) => billingApiV2.deductTokenUsage(usage);
export const createCheckoutSession = (request: CreateCheckoutSessionRequestV2) =>
  billingApiV2.createCheckoutSession(request);
export const createPortalSession = (request: CreatePortalSessionRequestV2) =>
  billingApiV2.createPortalSession(request);
export const cancelSubscription = (request?: CancelSubscriptionRequestV2) => billingApiV2.cancelSubscription(request);
export const reactivateSubscription = () => billingApiV2.reactivateSubscription();
export const purchaseCredits = (request: PurchaseCreditsRequestV2) => billingApiV2.purchaseCredits(request);
export const getTransactions = (limit?: number, offset?: number) => billingApiV2.getTransactions(limit, offset);
export const getUsageHistory = (days?: number) => billingApiV2.getUsageHistory(days);
export const triggerTestRenewal = () => billingApiV2.triggerTestRenewal();
export const getTrialStatus = () => billingApiV2.getTrialStatus();
export const startTrial = (request: TrialStartRequestV2) => billingApiV2.startTrial(request);
export const createTrialCheckout = (request: TrialCheckoutRequestV2) => billingApiV2.createTrialCheckout(request);
export const cancelTrial = () => billingApiV2.cancelTrial();

export type {
  SubscriptionInfoV2 as SubscriptionInfo,
  CreditBalanceV2 as CreditBalance,
  BillingStatusV2 as BillingStatus,
  TokenUsageV2 as TokenUsage,
  DeductResultV2 as DeductResult,
  TransactionV2 as Transaction,
  TransactionsResponseV2 as TransactionsResponse,
  UsageHistoryV2 as UsageHistory,
  CreateCheckoutSessionRequestV2 as CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponseV2 as CreateCheckoutSessionResponse,
  CreatePortalSessionRequestV2 as CreatePortalSessionRequest,
  CreatePortalSessionResponseV2 as CreatePortalSessionResponse,
  PurchaseCreditsRequestV2 as PurchaseCreditsRequest,
  PurchaseCreditsResponseV2 as PurchaseCreditsResponse,
  CancelSubscriptionRequestV2 as CancelSubscriptionRequest,
  CancelSubscriptionResponseV2 as CancelSubscriptionResponse,
  ReactivateSubscriptionResponseV2 as ReactivateSubscriptionResponse,
  TestRenewalResponseV2 as TestRenewalResponse,
  TrialStatusV2 as TrialStatus,
  TrialStartRequestV2 as TrialStartRequest,
  TrialStartResponseV2 as TrialStartResponse,
  TrialCheckoutRequestV2 as TrialCheckoutRequest,
  TrialCheckoutResponseV2 as TrialCheckoutResponse,
};


