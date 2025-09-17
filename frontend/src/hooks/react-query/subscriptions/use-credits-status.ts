import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export interface CreditsStatus {
  daily_credits: number;
  daily_credits_used: number;
  daily_credits_granted: number;
  daily_expires_in: string | null;
  tier_credits_limit: number;
  tier_credits_used: number;
  tier_credits_remaining: number;
  total_credits_available: number;
  subscription_name: string;
}

async function fetchCreditsStatus(token: string | null): Promise<CreditsStatus | null> {
  if (!token) return null;
  
  try {
    const response = await fetch(`${API_URL}/billing/credits-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch credits status');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching credits status:', error);
    return null;
  }
}

export function useCreditsStatus() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: ['credits-status', session?.access_token],
    queryFn: () => fetchCreditsStatus(session?.access_token || null),
    enabled: !!session?.access_token,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}