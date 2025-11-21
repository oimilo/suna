'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import { useBillingStatusQuery } from '@/hooks/billing/use-billing-status';
import type { BillingStatusResponse } from '@/lib/api/billing';
import { isLocalMode } from '@/lib/config';

interface BillingContextType {
  billingStatus: BillingStatusResponse | null;
  isLoading: boolean;
  error: Error | null;
  checkBillingStatus: (force?: boolean) => Promise<boolean>;
  lastCheckTime: number | null;
}

const BillingContext = createContext<BillingContextType | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const billingStatusQuery = useBillingStatusQuery();
  const lastCheckRef = useRef<number | null>(null);
  const checkInProgressRef = useRef(false);

  const checkBillingStatus = useCallback(
    async (force = false): Promise<boolean> => {
      if (isLocalMode()) {
        return false;
      }

      if (checkInProgressRef.current) {
        return !billingStatusQuery.data?.can_run;
      }

      const now = Date.now();
      if (!force && lastCheckRef.current && now - lastCheckRef.current < 60_000) {
        return !billingStatusQuery.data?.can_run;
      }

      try {
        checkInProgressRef.current = true;
        if (force || billingStatusQuery.isStale) {
          await billingStatusQuery.refetch();
        }
        lastCheckRef.current = now;
        return !billingStatusQuery.data?.can_run;
      } catch (err) {
        console.error('Error checking billing status:', err);
        return false;
      } finally {
        checkInProgressRef.current = false;
      }
    },
    [billingStatusQuery],
  );

  useEffect(() => {
    if (!billingStatusQuery.data) {
      checkBillingStatus(true);
    }
  }, [billingStatusQuery.data, checkBillingStatus]);

  const value = useMemo<BillingContextType>(
    () => ({
      billingStatus: billingStatusQuery.data ?? null,
      isLoading: billingStatusQuery.isLoading,
      error: billingStatusQuery.error ?? null,
      checkBillingStatus,
      lastCheckTime: lastCheckRef.current,
    }),
    [
      billingStatusQuery.data,
      billingStatusQuery.isLoading,
      billingStatusQuery.error,
      checkBillingStatus,
    ],
  );

  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}


