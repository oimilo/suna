/**
 * Model fallback configuration for handling access errors
 */

// Map of models to their fallback alternatives
export const MODEL_FALLBACK_MAP: Record<string, string[]> = {
  'anthropic/claude-sonnet-4': [
    'anthropic/claude-3-5-sonnet-latest',
    'anthropic/claude-3-7-sonnet-latest',
    'openrouter/deepseek/deepseek-chat-v3-0324',
    'openrouter/moonshotai/kimi-k2',
  ],
  'claude-sonnet-4': [
    'anthropic/claude-3-5-sonnet-latest',
    'anthropic/claude-3-7-sonnet-latest',
    'openrouter/deepseek/deepseek-chat-v3-0324',
    'openrouter/moonshotai/kimi-k2',
  ],
};

// Models that are generally available without subscription
export const FREE_TIER_MODELS = [
  'openrouter/moonshotai/kimi-k2',
  'openrouter/deepseek/deepseek-chat-v3-0324',
  'openrouter/deepseek/deepseek-chat',
  'xai/grok-4',
  'gemini/gemini-2.5-pro',
];

/**
 * Get fallback model for a given model that failed with 403
 */
export function getFallbackModel(failedModel: string): string | null {
  const fallbacks = MODEL_FALLBACK_MAP[failedModel];
  if (fallbacks && fallbacks.length > 0) {
    // Return the first fallback option
    return fallbacks[0];
  }
  
  // If no specific fallback, try a free tier model
  return FREE_TIER_MODELS[0] || null;
}

/**
 * Check if error is a model access error (403)
 */
export function isModelAccessError(error: any): boolean {
  if (!error) return false;
  
  // Check for 403 status
  if (error.status === 403) return true;
  
  // Check for specific error messages
  const errorMessage = error.message || error.toString();
  const accessErrorPatterns = [
    'subscription plan does not include access',
    'not available on your plan',
    'upgrade your subscription',
    'model not allowed',
    'permission denied',
    'access denied',
    '403',
  ];
  
  return accessErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern)
  );
}

/**
 * Extract model name from error message
 */
export function extractModelFromError(errorMessage: string): string | null {
  // Look for model patterns in the error message
  const modelPatterns = [
    /anthropic\/claude-[^\s,]+/i,
    /claude-[^\s,]+/i,
    /openai\/gpt-[^\s,]+/i,
    /gpt-[^\s,]+/i,
  ];
  
  for (const pattern of modelPatterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}