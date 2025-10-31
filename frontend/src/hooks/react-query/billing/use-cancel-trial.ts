import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { cancelTrial } from '@/lib/api/billing-v2';

export function useCancelTrial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelTrial,
    onSuccess: (data) => {
      toast.success(data.message || 'Teste cancelado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['trial-status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || 'Não foi possível cancelar o teste.';
      toast.error(message);
    },
  });
}

