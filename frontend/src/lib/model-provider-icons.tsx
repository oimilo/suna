import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

export const ModelProviderIcon = ({ modelId, size = 20 }: { modelId: string; size?: number }) => {
  // Minimal fallback icon map; extend as needed
  const id = (modelId || '').toLowerCase();
  if (id.includes('claude') || id.includes('anthropic')) {
    return <Sparkles size={size} className="text-amber-500" />;
  }
  return <Brain size={size} className="text-blue-500" />;
};



