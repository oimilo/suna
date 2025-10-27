import { useMemo } from 'react';
import { useModelStore, type SubscriptionStatus } from '@/lib/stores/model-store';

export function useModelSelection() {
  const selectedModel = useModelStore((s) => s.selectedModel);
  const customModels = useModelStore((s) => s.customModels);
  const setSelectedModel = useModelStore((s) => s.setSelectedModel);
  const addCustomModel = useModelStore((s) => s.addCustomModel);
  const updateCustomModel = useModelStore((s) => s.updateCustomModel);
  const removeCustomModel = useModelStore((s) => s.removeCustomModel);
  const getDefaultModel = useModelStore((s) => s.getDefaultModel);

  // Placeholder data structure; can be wired to a backend later
  const modelsData = useMemo(() => ({ models: [] as any[] }), []);

  const canAccessModel = (modelId: string) => {
    // For now allow all; premium gating can be handled elsewhere
    return true;
  };

  const handleModelChange = (modelId: string) => setSelectedModel(modelId);

  const subscriptionStatus: SubscriptionStatus = 'active';

  return {
    selectedModel,
    customModels,
    addCustomModel,
    updateCustomModel,
    removeCustomModel,
    getDefaultModel,
    handleModelChange,
    allModels: [] as any[],
    canAccessModel,
    subscriptionStatus,
    modelsData,
  };
}







