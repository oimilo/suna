'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink, CircleX } from 'lucide-react';

const DISMISSED_KEY = 'pipedream-account-status-dismissed';

export function PipedreamAccountStatus() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if the alert was previously dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="relative rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 p-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-all duration-200"
        onClick={handleDismiss}
      >
        <CircleX className="h-3.5 w-3.5 opacity-60" />
      </Button>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="p-2 rounded-md bg-transparent opacity-60">
            <Info className="h-4 w-4" />
          </div>
        </div>
        <div className="flex-1 pr-6">
          <h3 className="text-sm font-medium mb-1">
            Conta Pipedream Necessária
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Para conectar integrações com aplicativos externos, você precisa de uma conta Pipedream (gratuita).
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all duration-200 text-xs font-medium"
              onClick={() => window.open('https://pipedream.com/auth/signup', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1.5 opacity-60" />
              Criar Conta Gratuita
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all duration-200 text-xs"
              onClick={() => window.open('https://docs.pipedream.com/getting-started/', '_blank')}
            >
              <Info className="h-3 w-3 mr-1.5 opacity-60" />
              Saiba Mais
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}