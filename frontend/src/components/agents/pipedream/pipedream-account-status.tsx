'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink } from 'lucide-react';

export function PipedreamAccountStatus() {
  return (
    <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">Conta Pipedream Necessária</AlertTitle>
      <AlertDescription className="space-y-2 text-blue-800 dark:text-blue-200">
        <p>
          Para conectar integrações com aplicativos externos, você precisa de uma conta Pipedream (gratuita).
        </p>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900"
            onClick={() => window.open('https://pipedream.com/auth/signup', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Criar Conta Gratuita
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