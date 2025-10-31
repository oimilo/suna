'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Sparkles, AlertTriangle } from 'lucide-react';

import { useAuth } from '@/components/AuthProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCancelTrial } from '@/hooks/react-query/billing/use-cancel-trial';
import { useTrialStatus } from '@/hooks/react-query/billing/use-trial-status';

export function TrialManagement() {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { user } = useAuth();
  const { data: trialStatus, isLoading } = useTrialStatus(!!user);
  const cancelTrialMutation = useCancelTrial();

  if (isLoading || !trialStatus) {
    return null;
  }

  if (trialStatus.trial_status !== 'active') {
    return null;
  }

  const trialEndsAt = trialStatus.trial_ends_at ? new Date(trialStatus.trial_ends_at) : null;

  const handleCancelTrial = async () => {
    try {
      await cancelTrialMutation.mutateAsync();
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Não foi possível cancelar o teste gratuito:', error);
    }
  };

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Período de teste ativo</CardTitle>
          </div>
          <CardDescription>
            Você está aproveitando o teste gratuito com créditos promocionais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Teste encerra em</p>
              <p className="font-medium">
                {trialEndsAt
                  ? format(trialEndsAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : 'Data não informada'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(true)} disabled={cancelTrialMutation.isPending}>
              Cancelar teste agora
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancelar período de teste?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>Ao cancelar o teste gratuito você perderá o acesso imediato aos recursos premium.</p>
              <ul className="space-y-1">
                <li>• Os créditos promocionais restantes serão removidos.</li>
                <li>• Não será possível iniciar um novo teste gratuito no futuro.</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelTrialMutation.isPending}>
              Manter teste
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTrial}
              className="bg-destructive hover:bg-destructive/90"
              disabled={cancelTrialMutation.isPending}
            >
              {cancelTrialMutation.isPending ? 'Cancelando...' : 'Cancelar teste'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

