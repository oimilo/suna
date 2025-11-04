'use client';

import React, { createContext, useContext, ReactNode } from 'react';

import { useAuth } from '@/components/AuthProvider';
import {
  useCreditBalance,
  useSubscription,
} from '@/hooks/react-query/use-billing-v2';

interface SubscriptionContextValue {
  subscriptionData: ReturnType<typeof useSubscription>['data'];
  creditBalance: ReturnType<typeof useCreditBalance>['data'];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  refetchBalance: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch,
  } = useSubscription(isAuthenticated);

  const {
    data: creditBalance,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useCreditBalance(isAuthenticated);

  const value: SubscriptionContextValue = {
    subscriptionData: subscriptionData ?? null,
    creditBalance: creditBalance ?? null,
    isLoading: subscriptionLoading || balanceLoading,
    error: (subscriptionError || balanceError) as Error | null,
    refetch,
    refetchBalance,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }

  return context;
}

export function useSharedSubscription() {
  const context = useSubscriptionContext();

  return {
    data: context.subscriptionData,
    isLoading: context.isLoading,
    error: context.error,
    refetch: context.refetch,
  };
}

export function useSubscriptionData() {
  const context = useContext(SubscriptionContext);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const directSubscription = useSubscription(context ? false : isAuthenticated);
  const directCreditBalance = useCreditBalance(context ? false : isAuthenticated);

  const buildSubscriptionData = (
    subscription: SubscriptionContextValue['subscriptionData'],
    creditBalance: SubscriptionContextValue['creditBalance'],
  ) => {
    if (!subscription) {
      return null;
    }

    const normalizedSubscription = {
      ...subscription,
      current_usage:
        creditBalance?.lifetime_used ??
        (subscription as any)?.current_usage ??
        subscription.credits?.lifetime_used ??
        0,
      cost_limit:
        subscription.tier?.credits ??
        subscription.credits?.tier_credits ??
        (subscription as any)?.cost_limit ??
        0,
      credit_balance:
        creditBalance?.balance ??
        subscription.credits?.balance ??
        (subscription as any)?.credit_balance ??
        0,
      can_purchase_credits:
        creditBalance?.can_purchase_credits ??
        subscription.credits?.can_purchase_credits ??
        (subscription as any)?.can_purchase_credits ??
        false,
      subscription: subscription.subscription
        ? {
            ...subscription.subscription,
            cancel_at_period_end:
              subscription.subscription.cancel_at_period_end ??
              Boolean(subscription.subscription.cancel_at),
          }
        : null,
    } as typeof subscription & {
      current_usage: number;
      cost_limit: number;
      credit_balance: number;
      can_purchase_credits: boolean;
    };

    return normalizedSubscription;
  };

  if (context) {
    return {
      data: buildSubscriptionData(context.subscriptionData, context.creditBalance),
      isLoading: context.isLoading,
      error: context.error,
      refetch: context.refetch,
    };
  }

  return {
    data: buildSubscriptionData(directSubscription.data ?? null, directCreditBalance.data ?? null),
    isLoading: directSubscription.isLoading || directCreditBalance.isLoading,
    error: (directSubscription.error || directCreditBalance.error) as Error | null,
    refetch: directSubscription.refetch,
  };
}

export function useHasCredits(minimumCredits = 0) {
  const { creditBalance } = useSubscriptionContext();

  if (!creditBalance) {
    return false;
  }

  return creditBalance.balance >= minimumCredits;
}

export function useSubscriptionTier() {
  const { subscriptionData } = useSubscriptionContext();

  if (!subscriptionData) {
    return 'free';
  }

  return subscriptionData.tier?.name ?? 'free';
}

