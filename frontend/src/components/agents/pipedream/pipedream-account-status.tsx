'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { usePipedreamHealth } from '@/hooks/react-query/pipedream/use-pipedream';
import { Skeleton } from '@/components/ui/skeleton';

export function PipedreamAccountStatus() {
  const { data: health, isLoading, error } = usePipedreamHealth();

  if (isLoading) {
    return (
      <Alert>
        <Skeleton className="h-4 w-[250px]" />
      </Alert>
    );
  }

  const isConnected = health?.status === 'healthy' && health?.has_access_token;

  if (isConnected) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle>Pipedream Conectado</AlertTitle>
        <AlertDescription>
          Sua conta está conectada e pronta para usar integrações.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Pipedream Não Configurado</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Para conectar integrações, você precisa de uma conta Pipedream (gratuita).
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('https://pipedream.com/auth/signup', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Criar Conta
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('https://docs.pipedream.com/getting-started/', '_blank')}
          >
            <Info className="h-3 w-3 mr-2" />
            Saiba Mais
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}