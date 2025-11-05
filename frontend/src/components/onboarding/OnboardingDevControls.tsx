'use client';

import { useState } from 'react';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboarding } from '@/hooks/use-onboarding';
import { onboardingSteps } from './onboarding-config';
import { resetUserContext } from './shared/context';
import { useAuth } from '@/components/AuthProvider';

const SHOULD_RENDER = process.env.NODE_ENV !== 'production';

export function OnboardingDevControls() {
  const { startOnboarding, resetOnboarding, hasCompletedOnboarding, isOpen } = useOnboarding();
  const { supabase, user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!SHOULD_RENDER) {
    return null;
  }

  const clearLocalState = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('onboarding_completed');
        window.localStorage.removeItem('onboarding_project_id');
      }
    } catch (error) {
      console.warn('[OnboardingDevControls] Falha ao limpar localStorage', error);
    }
  };

  const handleStart = () => {
    resetOnboarding();
    resetUserContext();
    clearLocalState();
    startOnboarding(onboardingSteps);
    setMessage('Onboarding reiniciado');
  };

  const handleResetLocal = () => {
    resetOnboarding();
    resetUserContext();
    clearLocalState();
    setMessage('Estado local limpo');
  };

  const handleFullReset = () => {
    startTransition(async () => {
      resetOnboarding();
      resetUserContext();
      clearLocalState();

      if (supabase && user) {
        try {
          await supabase.auth.updateUser({
            data: {
              onboarding_completed: null,
              onboarding_completed_at: null,
              onboarding_project_id: null,
            },
          });
          setMessage('Estado global resetado (Supabase + local)');
        } catch (error) {
          console.error('[OnboardingDevControls] Erro ao atualizar metadados', error);
          setMessage('Falha ao limpar metadados no Supabase');
        }
      } else {
        setMessage('Estado local limpo (sem Supabase)');
      }
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <Card className="w-80 shadow-lg border-dashed border-primary/40 bg-background/95 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            Onboarding Dev Controls
            <Badge variant="outline">DEV</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 gap-2">
            <Button size="sm" variant="default" onClick={handleStart}>
              Reabrir onboarding
            </Button>
            <Button size="sm" variant="secondary" onClick={handleResetLocal}>
              Limpar estado local
            </Button>
            <Button size="sm" variant="outline" onClick={handleFullReset} disabled={isPending}>
              {isPending ? 'Resetando…' : 'Reset total (Supabase)'}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div>Aberto: {isOpen ? 'sim' : 'não'}</div>
            <div>Concluído: {hasCompletedOnboarding ? 'sim' : 'não'}</div>
          </div>

          {message && <div className="text-xs text-foreground/80">{message}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

