/**
 * Model fallback configuration - simplified for Claude Sonnet 4 only
 */

// All models fallback to Claude 4.5 Sonnet
export const MODEL_FALLBACK_MAP: Record<string, string[]> = {
  'anthropic/claude-4.5-sonnet': ['anthropic/claude-4.5-haiku'],
  'claude-4.5-sonnet': ['anthropic/claude-4.5-haiku'],
  'claude-sonnet-4-20250514': ['anthropic/claude-4.5-sonnet'],
  'claude-sonnet-4': ['anthropic/claude-4.5-sonnet'],
  'anthropic/claude-sonnet-4-20250514': ['anthropic/claude-4.5-sonnet'],
  'anthropic/claude-sonnet-4': ['anthropic/claude-4.5-sonnet'],
};

// Model padrão gratuito disponível
export const FREE_TIER_MODELS = [
  'anthropic/claude-4.5-haiku',
];

/**
 * Get fallback model - always returns Claude Sonnet 4
 */
export function getFallbackModel(failedModel: string): string | null {
  // Sempre retorna Claude 4.5 Sonnet como fallback avançado
  return 'anthropic/claude-4.5-sonnet';
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