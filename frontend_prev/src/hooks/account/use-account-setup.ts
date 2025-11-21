import { useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { backendApi } from '@/lib/api-client';

export function useInitializeAccount() {
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string; subscription_id?: string }> => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to initialize account');
      }
      // Use ensure-free-tier endpoint which gives free tier directly without Stripe
      const response = await backendApi.post(`/setup/ensure-free-tier`);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to initialize account');
      }
      return response.data;
    },
  });
}

