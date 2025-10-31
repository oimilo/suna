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

