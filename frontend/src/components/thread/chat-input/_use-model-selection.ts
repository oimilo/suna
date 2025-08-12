'use client';

import { useSubscription } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { useState, useEffect, useMemo } from 'react';
import { isLocalMode } from '@/lib/config';
import { useAvailableModels } from '@/hooks/react-query/subscriptions/use-model';
import { hasActiveSubscription as checkActiveSubscription } from '@/lib/subscription-utils';

export const STORAGE_KEY_MODEL = 'suna-preferred-model-v4'; // Changed version to force reset
export const STORAGE_KEY_CUSTOM_MODELS = 'customModels';
export const DEFAULT_PREMIUM_MODEL_ID = 'claude-sonnet-4-20250514'; // Claude 4 Sonnet
export const DEFAULT_FREE_MODEL_ID = 'claude-sonnet-4-20250514'; // Same for all users now
// export const DEFAULT_FREE_MODEL_ID = 'deepseek/deepseek-chat';

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
  // Premium tier models
  'claude-sonnet-4': { 
    tier: 'premium',
    priority: 100, 
    recommended: true,
    lowQuality: false
  },

  // 'gemini-flash-2.5': { 
  //   tier: 'free', 
  //   priority: 70,
  //   recommended: false,
  //   lowQuality: false
  // },
  // 'qwen3': { 
  //   tier: 'free', 
  //   priority: 60,
  //   recommended: false,
  //   lowQuality: false
  // },

  // DeepSeek V3 - excellent coding model at low cost
  'deepseek/deepseek-chat': {
    tier: 'free',
    priority: 98,
    recommended: true,
    lowQuality: false
  },

  // Premium/Paid tier models (require subscription) - except specific free models
  'moonshotai/kimi-k2': { 
    tier: 'free', 
    priority: 99,
    recommended: false,
    lowQuality: false
  },
  'grok-4': { 
    tier: 'premium', 
    priority: 98,
    recommended: false,
    lowQuality: false
  },
  'sonnet-3.7': { 
    tier: 'premium', 
    priority: 97, 
    recommended: false,
    lowQuality: false
  },
  'google/gemini-2.5-pro': { 
    tier: 'premium', 
    priority: 96,
    recommended: false,
    lowQuality: false
  },
  'gpt-4.1': { 
    tier: 'premium', 
    priority: 96,
    recommended: false,
    lowQuality: false
  },
  'sonnet-3.5': { 
    tier: 'premium', 
    priority: 90,
    recommended: false,
    lowQuality: false
  },
  'gpt-4o': { 
    tier: 'premium', 
    priority: 88,
    recommended: false,
    lowQuality: false
  },
  'gemini-2.5-flash:thinking': { 
    tier: 'premium', 
    priority: 84,
    recommended: false,
    lowQuality: false
  },
  // 'deepseek/deepseek-chat-v3-0324': { 
  //   tier: 'free', 
  //   priority: 75,
  //   recommended: false,
  //   lowQuality: false
  // },
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
    let models = [];
    
    // Default models if API data not available
    if (!modelsData?.models || isLoadingModels) {
      models = [
        { 
          id: DEFAULT_FREE_MODEL_ID, 
          label: 'DeepSeek', 
          requiresSubscription: false,
          priority: MODELS[DEFAULT_FREE_MODEL_ID]?.priority || 50
        },
        { 
          id: DEFAULT_PREMIUM_MODEL_ID, 
          label: 'Sonnet 4', 
          requiresSubscription: true, 
          priority: MODELS[DEFAULT_PREMIUM_MODEL_ID]?.priority || 100
        },
      ];
    } else {
      // Process API-provided models
      models = modelsData.models.map(model => {
        const shortName = model.short_name || model.id;
        const displayName = model.display_name || shortName;
        
        // Format the display label
        let cleanLabel = displayName;
        if (cleanLabel.includes('/')) {
          cleanLabel = cleanLabel.split('/').pop() || cleanLabel;
        }
        
        cleanLabel = cleanLabel
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Get model data from our central MODELS constant
        const modelData = MODELS[shortName] || {};
        const isPremium = model?.requires_subscription || modelData.tier === 'premium' || false;
        
        return {
          id: shortName,
          label: cleanLabel,
          requiresSubscription: isPremium,
          top: modelData.priority >= 90, // Mark high-priority models as "top"
          priority: modelData.priority || 0,
          lowQuality: modelData.lowQuality || false,
          recommended: modelData.recommended || false
        };
      });
    }
    
    // Add custom models if in local mode
    if (isLocalMode() && customModels.length > 0) {
      const customModelOptions = customModels.map(model => ({
        id: model.id,
        label: model.label || formatModelName(model.id),
        requiresSubscription: false,
        top: false,
        isCustom: true,
        priority: 30, // Low priority by default
        lowQuality: false,
        recommended: false
      }));
      
      models = [...models, ...customModelOptions];
    }
    
    // Sort models consistently in one place:
    // 1. First by recommended (recommended first)
    // 2. Then by priority (higher first)
    // 3. Finally by name (alphabetical)
    const sortedModels = models.sort((a, b) => {
      // First by recommended status
      if (a.recommended !== b.recommended) {
        return a.recommended ? -1 : 1;
      }

      // Then by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Finally by name
      return a.label.localeCompare(b.label);
    });
    return sortedModels;
  }, [modelsData, isLoadingModels, customModels]);

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
      
      // Always use Claude Sonnet 4 - ignore saved preferences
      const fixedModel = 'claude-sonnet-4-20250514';
      console.log('Using fixed model Claude Sonnet 4:', fixedModel);
      
      // Clear old localStorage to prevent confusion
      localStorage.removeItem('suna-preferred-model-v3'); // Remove old version
      localStorage.setItem(STORAGE_KEY_MODEL, fixedModel); // Save new fixed model
      
      setSelectedModel(fixedModel);
      setHasInitialized(true);
      
    } catch (error) {
      console.warn('Failed to set model:', error);
      const defaultModel = 'claude-sonnet-4-20250514';
      setSelectedModel(defaultModel);
      saveModelPreference(defaultModel);
      setHasInitialized(true);
    }
  }, [subscriptionStatus, MODEL_OPTIONS, isLoadingModels, customModels, hasInitialized]);

  // Handle model selection change
  const handleModelChange = (modelId: string) => {
    console.log('handleModelChange called with:', modelId, '- forcing Claude Sonnet 4');
    
    // Always use Claude Sonnet 4 regardless of selection
    const fixedModel = 'claude-sonnet-4-20250514';
    
    console.log('Setting fixed model:', fixedModel);
    setSelectedModel(fixedModel);
    saveModelPreference(fixedModel);
  };

  // Get the actual model ID to send to the backend
  const getActualModelId = (modelId: string): string => {
    // Always return Claude Sonnet 4
    return 'claude-sonnet-4-20250514';
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