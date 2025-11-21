'use client';

import { useModelSelection as useAgentModelSelection } from '@/hooks/agents/use-model-selection';

/**
 * Compat layer for legacy imports (e.g. pricing pages) that used to rely on
 * thread-specific model selection helpers. The upstream implementation now
 * lives under `hooks/agents/use-model-selection`, so we simply re-export the
 * hook to keep existing import paths working.
 */
export const useModelSelection = () => {
  return useAgentModelSelection();
};

export type UseModelSelectionReturn = ReturnType<typeof useAgentModelSelection>;

