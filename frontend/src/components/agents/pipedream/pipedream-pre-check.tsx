'use client';

import { useEffect, useState } from 'react';
import { pipedreamApi } from '@/hooks/react-query/pipedream/utils';
import { toast } from 'sonner';

interface PipedreamPreCheckResult {
  hasAccount: boolean;
  isChecking: boolean;
  error?: string;
}

export function usePipedreamPreCheck(): PipedreamPreCheckResult {
  const [hasAccount, setHasAccount] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    checkPipedreamAccount();
  }, []);

  const checkPipedreamAccount = async () => {
    try {
      setIsChecking(true);
      const health = await pipedreamApi.checkHealth();
      
      if (health.status === 'healthy' && health.has_access_token) {
        setHasAccount(true);
      } else {
        setHasAccount(false);
        setError('Conta Pipedream não configurada');
      }
    } catch (err) {
      setHasAccount(false);
      setError('Erro ao verificar conta Pipedream');
      console.error('Pipedream check error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  return { hasAccount, isChecking, error };
}

export function checkPipedreamBeforeConnect(): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      const health = await pipedreamApi.checkHealth();
      
      if (health.status === 'healthy' && health.has_access_token) {
        resolve(true);
      } else {
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
      }
    } catch (err) {
      toast.error('Erro ao verificar conta Pipedream');
      resolve(false);
    }
  });
}