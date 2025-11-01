/**
 * Map frontend model IDs to backend/API model names
 */
export const MODEL_MAPPING: Record<string, string> = {
  // Claude models - direciona aliases antigos para os modelos 4.5
  'claude-sonnet-4': 'anthropic/claude-sonnet-4-5-20250929',
  'claude-sonnet-4-20250514': 'anthropic/claude-sonnet-4-5-20250929',
  'claude-sonnet-4-0': 'anthropic/claude-sonnet-4-5-20250929',
  'anthropic/claude-sonnet-4-20250514': 'anthropic/claude-sonnet-4-5-20250929',
  'anthropic/claude-sonnet-4': 'anthropic/claude-sonnet-4-5-20250929',
  'claude-4.5-sonnet': 'anthropic/claude-sonnet-4-5-20250929',
  'claude-sonnet-4-5-20250929': 'anthropic/claude-sonnet-4-5-20250929',
  'claude-4.5-sonnet-latest': 'anthropic/claude-sonnet-4-5-20250929',
  'anthropic/claude-4.5-sonnet': 'anthropic/claude-sonnet-4-5-20250929',

  // Haiku aliases
  'claude-haiku': 'anthropic/claude-haiku-4-5-20251001',
  'claude-haiku-3.5': 'anthropic/claude-haiku-4-5-20251001',
  'claude-3.5-haiku': 'anthropic/claude-haiku-4-5-20251001',
  'anthropic/claude-haiku-3-5': 'anthropic/claude-haiku-4-5-20251001',
  'anthropic/claude-4.5-haiku': 'anthropic/claude-haiku-4-5-20251001',
  'claude-4.5-haiku': 'anthropic/claude-haiku-4-5-20251001',
  'claude-haiku-4-5-20251001': 'anthropic/claude-haiku-4-5-20251001',

  // Add other model mappings as needed
  'gemini-flash': 'google/gemini-flash-1.5',
  'gpt-4': 'openai/gpt-4',
  'gpt-4o': 'openai/gpt-4o',
  'grok-beta': 'x-ai/grok-beta',
  
  // Default passthrough for models already in correct format
};

/**
 * Get the backend model name from frontend model ID
 */
export function getBackendModelName(frontendModelId: string): string {
  // Check if we have a mapping
  const mapped = MODEL_MAPPING[frontendModelId];
  if (mapped) {
    return mapped;
  }
  
  // If no mapping, return as-is (for models already in correct format)
  return frontendModelId;
}