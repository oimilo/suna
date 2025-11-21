'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  useSubscriptionStore,
  useSubscriptionStoreSync,
  type SubscriptionStoreState,
} from '@/stores/subscription-store';
import { useShallow } from 'zustand/react/shallow';

interface SubscriptionContextType {
  subscriptionData: SubscriptionStoreState['subscriptionData'];
  creditBalance: SubscriptionStoreState['creditBalance'];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  refetchBalance: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  useSubscriptionStoreSync();

  const value = useSubscriptionStore(
    useShallow((state) => ({
      subscriptionData: state.subscriptionData,
      creditBalance: state.creditBalance,
      isLoading: state.isLoading,
      error: state.error,
      refetch: state.refetch,
      refetchBalance: state.refetchBalance,
    })),
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      'useSubscriptionContext must be used within a SubscriptionProvider',
    );
  }
  return context;
}

export function useSharedSubscription() {
  const { subscriptionData, isLoading, error, refetch } =
    useSubscriptionContext();
  return {
    data: subscriptionData,
    isLoading,
    error,
    refetch,
  };
}

export function useSubscriptionTier() {
  const { subscriptionData } = useSubscriptionContext();
  return subscriptionData?.tier?.name ?? 'free';
}

export function useHasCredits(minimumCredits = 0) {
  const { creditBalance } = useSubscriptionContext();
  if (!creditBalance) {
    return false;
  }
  return creditBalance.balance >= minimumCredits;
}

export function useSubscriptionData() {
  const {
    subscriptionData,
    creditBalance,
    isLoading,
    error,
    refetch,
  } = useSubscriptionContext();

  const enrichedSubscription = useMemo(() => {
    if (!subscriptionData) {
      return null;
    }

    return {
      ...subscriptionData,
      current_usage: creditBalance?.lifetime_used ?? 0,
      cost_limit: subscriptionData.tier.credits,
      credit_balance: creditBalance?.balance ?? 0,
      can_purchase_credits: creditBalance?.can_purchase_credits ?? false,
      subscription: subscriptionData.subscription
        ? {
            ...subscriptionData.subscription,
            cancel_at_period_end: Boolean(
              subscriptionData.subscription.cancel_at,
            ),
          }
        : null,
    };
  }, [subscriptionData, creditBalance]);

  return {
    data: enrichedSubscription,
    isLoading,
    error,
    refetch,
  };
}


