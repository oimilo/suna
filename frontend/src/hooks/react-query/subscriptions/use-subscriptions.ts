'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import {
  getSubscription,
  getSubscriptionCommitment,
  createPortalSession,
  SubscriptionStatus,
  CommitmentInfo,
} from '@/lib/api';
import { subscriptionKeys } from './keys';
import { hasPlan as checkHasPlan } from '@/lib/subscription-utils';

export const useSubscription = createQueryHook(
  subscriptionKeys.details(),
  getSubscription,
  {
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  },
);

// Smart subscription hook that adapts refresh based on streaming state
export const useSubscriptionWithStreaming = (isStreaming: boolean = false) => {
  const [isVisible, setIsVisible] = useState(true);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return useQuery({
    queryKey: subscriptionKeys.details(),
    queryFn: getSubscription,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: () => {
      // No refresh if tab is hidden
      if (!isVisible) return false;
      
      // If actively streaming: refresh every 5s (costs are changing)
      if (isStreaming) return 2 * 60 * 1000;
      
      // If visible but not streaming: refresh every 5min
      return 10 * 60 * 1000;
    },
    refetchIntervalInBackground: false, // Stop when tab backgrounded
  });
};

export const useCreatePortalSession = createMutationHook(
  (params: { return_url: string }) => createPortalSession(params),
  {
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
  },
);

export const useSubscriptionCommitment = (subscriptionId?: string, enabled = true) =>
  useQuery<CommitmentInfo | null>({
    queryKey: subscriptionKeys.commitment(subscriptionId || ''),
    queryFn: () => getSubscriptionCommitment(subscriptionId!),
    enabled: enabled && !!subscriptionId,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

export const isPlan = (
  subscriptionData: SubscriptionStatus | null | undefined,
  planId?: string,
): boolean => {
  if (!planId) return false;
  
  // Map planId to the format expected by checkHasPlan
  const mappedPlanId = planId === 'base' ? 'pro' : 
                       planId === 'extra' ? 'pro_max' : 
                       planId as 'free' | 'pro' | 'pro_max' | 'enterprise';
  
  return checkHasPlan(subscriptionData, mappedPlanId);
};
