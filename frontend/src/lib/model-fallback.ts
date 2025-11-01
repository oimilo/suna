/**
 * Model fallback configuration - simplified for Claude Sonnet 4 only
 */

// Fallbacks priorizam modelos estáveis (Sonnet 4 / Haiku 3.5 / DeepSeek)
export const MODEL_FALLBACK_MAP: Record<string, string[]> = {
  'anthropic/claude-sonnet-4-5-20250929': [
    'anthropic/claude-sonnet-4-20250514',
    'anthropic/claude-3-7-sonnet-latest',
  ],
  'claude-sonnet-4-5-20250929': [
    'anthropic/claude-sonnet-4-20250514',
    'anthropic/claude-3-7-sonnet-latest',
  ],
  'anthropic/claude-sonnet-4-20250514': ['anthropic/claude-3-7-sonnet-latest'],
  'claude-sonnet-4-20250514': ['anthropic/claude-3-7-sonnet-latest'],
  'claude-sonnet-4': ['anthropic/claude-3-7-sonnet-latest'],
  'anthropic/claude-sonnet-4': ['anthropic/claude-3-7-sonnet-latest'],

  'anthropic/claude-haiku-4-5-20251001': [
    'anthropic/claude-3.5-haiku',
    'deepseek/deepseek-chat-v3.1',
  ],
  'claude-haiku-4-5-20251001': [
    'anthropic/claude-3.5-haiku',
    'deepseek/deepseek-chat-v3.1',
  ],
  'anthropic/claude-3.5-haiku': ['deepseek/deepseek-chat-v3.1'],
  'claude-3.5-haiku': ['deepseek/deepseek-chat-v3.1'],
};

// Model padrão gratuito disponível
export const FREE_TIER_MODELS = [
  'anthropic/claude-haiku-4-5-20251001',
  'anthropic/claude-3.5-haiku',
];

/**
 * Get fallback model - always returns Claude Sonnet 4
 */
export function getFallbackModel(failedModel: string): string | null {
  // Usa Sonnet 4 como fallback padrão quando nada definido
  return 'anthropic/claude-sonnet-4-20250514';
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