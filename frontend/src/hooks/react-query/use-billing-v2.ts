import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  billingApiV2,
  CreateCheckoutSessionRequest,
  CreatePortalSessionRequest,
  PurchaseCreditsRequest,
  TokenUsage,
  CancelSubscriptionRequest,
} from '@/lib/api/billing-v2';

export const billingKeys = {
  all: ['billing'] as const,
  subscription: () => [...billingKeys.all, 'subscription'] as const,
  balance: () => [...billingKeys.all, 'balance'] as const,
  status: () => [...billingKeys.all, 'status'] as const,
  transactions: (limit?: number, offset?: number, typeFilter?: string) =>
    [...billingKeys.all, 'transactions', { limit, offset, typeFilter }] as const,
  usageHistory: (days?: number) =>
    [...billingKeys.all, 'usage-history', { days }] as const,
};

export const useSubscription = (enabled = true) =>
  useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: () => billingApiV2.getSubscription(),
    staleTime: 60_000,
    enabled,
  });

export const useCreditBalance = (enabled = true) =>
  useQuery({
    queryKey: billingKeys.balance(),
    queryFn: () => billingApiV2.getCreditBalance(),
    staleTime: 30_000,
    enabled,
  });

export const useBillingStatus = () =>
  useQuery({
    queryKey: billingKeys.status(),
    queryFn: () => billingApiV2.checkBillingStatus(),
    staleTime: 30_000,
  });

export const useTransactions = (limit = 50, offset = 0, typeFilter?: string) =>
  useQuery({
    queryKey: billingKeys.transactions(limit, offset, typeFilter),
    queryFn: () => billingApiV2.getTransactions(limit, offset, typeFilter),
    staleTime: 5 * 60_000,
  });

export const useUsageHistory = (days = 30) =>
  useQuery({
    queryKey: billingKeys.usageHistory(days),
    queryFn: () => billingApiV2.getUsageHistory(days),
    staleTime: 10 * 60_000,
  });

export const useCreateCheckoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateCheckoutSessionRequest) =>
      billingApiV2.createCheckoutSession(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() });
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
  });
};

export const useCreatePortalSession = () =>
  useMutation({
    mutationFn: (request: CreatePortalSessionRequest) =>
      billingApiV2.createPortalSession(request),
    onSuccess: (data) => {
      if (data.portal_url) {
        window.location.href = data.portal_url;
      }
    },
  });

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request?: CancelSubscriptionRequest) =>
      billingApiV2.cancelSubscription(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: billingKeys.balance() });
    },
  });
};

export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApiV2.reactivateSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: billingKeys.balance() });
    },
  });
};

export const usePurchaseCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PurchaseCreditsRequest) => billingApiV2.purchaseCredits(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.balance() });
      queryClient.invalidateQueries({ queryKey: billingKeys.transactions() });
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
  });
};

export const useDeductTokenUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (usage: TokenUsage) => billingApiV2.deductTokenUsage(usage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.balance() });
      queryClient.invalidateQueries({ queryKey: billingKeys.status() });
    },
  });
};

export const useTriggerTestRenewal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApiV2.triggerTestRenewal(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
};

