/**
 * Map frontend model IDs to backend/API model names
 */
export const MODEL_MAPPING: Record<string, string> = {
  // Claude models - Sonnet 4 now uses direct Anthropic API
  'claude-sonnet-4': 'claude-sonnet-4-20250514',
  'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
  'claude-sonnet-4-0': 'claude-sonnet-4-20250514',
  'anthropic/claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
  'anthropic/claude-sonnet-4': 'claude-sonnet-4-20250514',
  
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