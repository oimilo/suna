'use client';

import { useSubscription } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { useState, useEffect, useMemo } from 'react';
import { isLocalMode } from '@/lib/config';
import { useAvailableModels } from '@/hooks/react-query/subscriptions/use-model';
import { hasActiveSubscription as checkActiveSubscription } from '@/lib/subscription-utils';

export const STORAGE_KEY_MODEL = 'suna-preferred-model-v5'; // Changed version to force reset with new models
export const STORAGE_KEY_CUSTOM_MODELS = 'customModels';
export const DEFAULT_PREMIUM_MODEL_ID = 'openai/gpt-5'; // GPT-5 - Agente avançado
export const DEFAULT_FREE_MODEL_ID = 'deepseek/deepseek-chat-v3.1'; // DeepSeek V3.1 - Agente padrão

export type SubscriptionStatus = 'no_subscription' | 'active';

export interface ModelOption {
  id: string;
  label: string;
  requiresSubscription: boolean;
  description?: string;
  top?: boolean;
  isCustom?: boolean;
  priority?: number;
}

export interface CustomModel {
  id: string;
  label: string;
}

// SINGLE SOURCE OF TRUTH for all model data - aligned with backend constants
export const MODELS = {
  // Agente padrão - DeepSeek V3.1 (Free for all users)
  'deepseek/deepseek-chat-v3.1': {
    tier: 'free',
    priority: 90,
    recommended: true,
    lowQuality: false
  },
  
  // Agente avançado - GPT-5 (Premium only)
  'openai/gpt-5': {
    tier: 'premium',
    priority: 100,
    recommended: true,
    lowQuality: false
  }
};

// Helper to check if a user can access a model based on subscription status
export const canAccessModel = (
  subscriptionStatus: SubscriptionStatus,
  requiresSubscription: boolean,
): boolean => {
  if (isLocalMode()) {
    return true;
  }
  return subscriptionStatus === 'active' || !requiresSubscription;
};

// Helper to format a model name for display
export const formatModelName = (name: string): string => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Add openrouter/ prefix to custom models
export const getPrefixedModelId = (modelId: string, isCustom: boolean): string => {
  if (isCustom && !modelId.startsWith('openrouter/')) {
    return `openrouter/${modelId}`;
  }
  return modelId;
};

// Helper to get custom models from localStorage
export const getCustomModels = (): CustomModel[] => {
  if (!isLocalMode() || typeof window === 'undefined') return [];
  
  try {
    const storedModels = localStorage.getItem(STORAGE_KEY_CUSTOM_MODELS);
    if (!storedModels) return [];
    
    const parsedModels = JSON.parse(storedModels);
    if (!Array.isArray(parsedModels)) return [];
    
    return parsedModels
      .filter((model: any) => 
        model && typeof model === 'object' && 
        typeof model.id === 'string' && 
        typeof model.label === 'string');
  } catch (e) {
    console.error('Error parsing custom models:', e);
    return [];
  }
};

// Helper to save model preference to localStorage safely
const saveModelPreference = (modelId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  } catch (error) {
    console.warn('Failed to save model preference to localStorage:', error);
  }
};

export const useModelSelection = () => {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_FREE_MODEL_ID);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { data: subscriptionData } = useSubscription();
  const { data: modelsData, isLoading: isLoadingModels } = useAvailableModels({
    refetchOnMount: false,
  });

  const subscriptionStatus: SubscriptionStatus = checkActiveSubscription(subscriptionData) 
    ? 'active' 
    : 'no_subscription';

  // Function to refresh custom models from localStorage
  const refreshCustomModels = () => {
    if (isLocalMode() && typeof window !== 'undefined') {
      const freshCustomModels = getCustomModels();
      setCustomModels(freshCustomModels);
    }
  };

  // Load custom models from localStorage
  useEffect(() => {
    refreshCustomModels();
  }, []);

  // Generate model options list with consistent structure
  const MODEL_OPTIONS = useMemo(() => {
    // Fixed model list with custom aliases
    const models = [
      { 
        id: DEFAULT_FREE_MODEL_ID, 
        label: 'Agente padrão', 
        requiresSubscription: false,
        priority: MODELS[DEFAULT_FREE_MODEL_ID]?.priority || 90,
        recommended: true
      },
      { 
        id: DEFAULT_PREMIUM_MODEL_ID, 
        label: 'Agente avançado', 
        requiresSubscription: true, 
        priority: MODELS[DEFAULT_PREMIUM_MODEL_ID]?.priority || 100,
        recommended: true
      },
    ];
    
    // Sort models by priority (higher first)
    const sortedModels = models.sort((a, b) => b.priority - a.priority);
    return sortedModels;
  }, []);

  // Get filtered list of models the user can access (no additional sorting)
  const availableModels = useMemo(() => {
    return isLocalMode() 
      ? MODEL_OPTIONS 
      : MODEL_OPTIONS.filter(model => 
          canAccessModel(subscriptionStatus, model.requiresSubscription)
        );
  }, [MODEL_OPTIONS, subscriptionStatus]);

  // Initialize selected model from localStorage ONLY ONCE
  useEffect(() => {
    if (typeof window === 'undefined' || hasInitialized) return;
    
    console.log('Initializing model selection from localStorage...');
    
    try {
      // Skip localStorage during SSR/build
      if (typeof window === 'undefined') {
        console.log('Skipping localStorage during SSR');
        return;
      }
      
      // Check saved preference
      const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);
      
      // Determine default model based on subscription
      const defaultModel = subscriptionStatus === 'active' 
        ? DEFAULT_PREMIUM_MODEL_ID 
        : DEFAULT_FREE_MODEL_ID;
      
      // Use saved model if available and user has access, otherwise use default
      const modelToUse = savedModel && MODEL_OPTIONS.find(m => m.id === savedModel) && 
                         canAccessModel(subscriptionStatus, MODEL_OPTIONS.find(m => m.id === savedModel)!.requiresSubscription)
        ? savedModel 
        : defaultModel;
      
      console.log('Selected model:', modelToUse, 'Subscription:', subscriptionStatus);
      
      // Clear old localStorage versions
      localStorage.removeItem('suna-preferred-model-v3');
      
      setSelectedModel(modelToUse);
      saveModelPreference(modelToUse);
      setHasInitialized(true);
      
    } catch (error) {
      console.warn('Failed to initialize model:', error);
      const defaultModel = subscriptionStatus === 'active' 
        ? DEFAULT_PREMIUM_MODEL_ID 
        : DEFAULT_FREE_MODEL_ID;
      setSelectedModel(defaultModel);
      saveModelPreference(defaultModel);
      setHasInitialized(true);
    }
  }, [subscriptionStatus, MODEL_OPTIONS, hasInitialized]);

  // Handle model selection change
  const handleModelChange = (modelId: string) => {
    console.log('handleModelChange called with:', modelId);
    
    // Check if user has access to this model
    const model = MODEL_OPTIONS.find(m => m.id === modelId);
    if (!model) {
      console.warn('Model not found:', modelId);
      return;
    }
    
    if (!canAccessModel(subscriptionStatus, model.requiresSubscription)) {
      console.warn('User does not have access to model:', modelId);
      return;
    }
    
    console.log('Setting selected model:', modelId);
    setSelectedModel(modelId);
    saveModelPreference(modelId);
  };

  // Get the actual model ID to send to the backend
  const getActualModelId = (modelId: string): string => {
    // Return the selected model ID
    return modelId;
  };

  return {
    selectedModel,
    setSelectedModel: (modelId: string) => {
      handleModelChange(modelId);
    },
    subscriptionStatus,
    availableModels,
    allModels: MODEL_OPTIONS,  // Already pre-sorted
    customModels,
    getActualModelId,
    refreshCustomModels,
    canAccessModel: (modelId: string) => {
      if (isLocalMode()) return true;
      const model = MODEL_OPTIONS.find(m => m.id === modelId);
      return model ? canAccessModel(subscriptionStatus, model.requiresSubscription) : false;
    },
    isSubscriptionRequired: (modelId: string) => {
      return MODEL_OPTIONS.find(m => m.id === modelId)?.requiresSubscription || false;
    }
  };
};

// Export the hook but not any sorting logic - sorting is handled internally