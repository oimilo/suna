'use client';

interface PipedreamPreCheckResult {
  hasAccount: boolean;
  isChecking: boolean;
  error?: string;
}

export function usePipedreamPreCheck(): PipedreamPreCheckResult {
  // Integrações estão disponíveis sem necessidade de conta adicional
  return { 
    hasAccount: true, 
    isChecking: false, 
    error: undefined 
  };
}

export function checkPipedreamBeforeConnect(): Promise<boolean> {
  return new Promise((resolve) => {
    // Integrações disponíveis diretamente
    resolve(true);
  });
}