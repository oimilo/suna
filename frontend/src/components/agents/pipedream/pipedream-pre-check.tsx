'use client';

import { toast } from 'sonner';

interface PipedreamPreCheckResult {
  hasAccount: boolean;
  isChecking: boolean;
  error?: string;
}

export function usePipedreamPreCheck(): PipedreamPreCheckResult {
  // Como não temos uma forma direta de verificar se o usuário tem conta no Pipedream,
  // retornamos sempre false para mostrar o card informativo
  return { 
    hasAccount: false, 
    isChecking: false, 
    error: 'Conta Pipedream necessária para integrações' 
  };
}

export function checkPipedreamBeforeConnect(): Promise<boolean> {
  return new Promise((resolve) => {
    // Sempre mostra o toast informativo
    toast.error(
      'Você precisa de uma conta Pipedream para conectar integrações',
      {
        description: 'Clique para criar uma conta gratuita',
        action: {
          label: 'Criar Conta',
          onClick: () => window.open('https://pipedream.com/auth/signup', '_blank')
        },
        duration: 8000
      }
    );
    resolve(false);
  });
}