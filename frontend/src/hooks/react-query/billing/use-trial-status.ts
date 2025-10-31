import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getTrialStatus, startTrial } from '@/lib/api/billing-v2';

export function useTrialStatus(enabled = true) {
  return useQuery({
    queryKey: ['trial-status'],
    queryFn: getTrialStatus,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled,
  });
}

export function useStartTrial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startTrial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trial-status'] });
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
    },
    onError: (error: any) => {
      if (error?.message?.includes('already have')) {
        toast.error('Você já utilizou seu período de teste gratuito.');
      } else {
        toast.error('Não foi possível iniciar o teste. Tente novamente.');
      }
    },
  });
}

