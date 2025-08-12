import { useState, useCallback } from 'react';
import { startAgent } from '@/lib/api';

interface UseModelWithFallbackOptions {
  onFallbackUsed?: (originalModel: string, fallbackModel: string) => void;
  showToast?: boolean;
}

export function useModelWithFallback(options?: UseModelWithFallbackOptions) {
  const [lastUsedModel, setLastUsedModel] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const startAgentWithFallback = useCallback(async (
    threadId: string,
    agentOptions?: {
      model_name?: string;
      enable_thinking?: boolean;
      reasoning_effort?: string;
      stream?: boolean;
      agent_id?: string;
    }
  ) => {
    // Always use Claude Sonnet 4
    const fixedModel = 'claude-sonnet-4-20250514';
    
    try {
      setIsRetrying(false);
      const result = await startAgent(threadId, {
        ...agentOptions,
        model_name: fixedModel,
      });
      setLastUsedModel(fixedModel);
      return result;
    } catch (error: any) {
      console.error('[ModelFallback] Error with Claude Sonnet 4:', error);
      // No fallback needed - always use Claude Sonnet 4
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [options]);

  return {
    startAgentWithFallback,
    lastUsedModel,
    isRetrying,
  };
}