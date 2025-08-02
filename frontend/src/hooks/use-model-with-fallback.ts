import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getFallbackModel, isModelAccessError } from '@/lib/model-fallback';
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
    const requestedModel = agentOptions?.model_name || 'claude-sonnet-4';
    
    try {
      setIsRetrying(false);
      const result = await startAgent(threadId, agentOptions);
      setLastUsedModel(requestedModel);
      return result;
    } catch (error: any) {
      console.error('[ModelFallback] Error with model:', requestedModel, error);
      
      // Check if it's a model access error (403)
      if (isModelAccessError(error) && !isRetrying) {
        const fallbackModel = getFallbackModel(requestedModel);
        
        if (fallbackModel) {
          console.log('[ModelFallback] Trying fallback model:', fallbackModel);
          setIsRetrying(true);
          
          // Notify about fallback
          if (options?.showToast !== false) {
            toast.info(
              `O modelo ${requestedModel} não está disponível no momento. Usando ${fallbackModel} como alternativa.`,
              { duration: 5000 }
            );
          }
          
          // Call the callback if provided
          options?.onFallbackUsed?.(requestedModel, fallbackModel);
          
          try {
            // Retry with fallback model
            const fallbackResult = await startAgent(threadId, {
              ...agentOptions,
              model_name: fallbackModel,
            });
            
            setLastUsedModel(fallbackModel);
            return fallbackResult;
          } catch (fallbackError) {
            console.error('[ModelFallback] Fallback also failed:', fallbackError);
            // If fallback also fails, throw the original error
            throw error;
          }
        }
      }
      
      // If not a model access error or no fallback available, throw the original error
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