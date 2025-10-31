'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cancelSubscription } from '@/lib/api/billing-v2';
import { subscriptionKeys } from '@/hooks/react-query/subscriptions/keys';

interface CancelSubscriptionButtonProps {
  subscriptionId?: string;
  hasCommitment?: boolean;
  commitmentEndDate?: string;
  monthsRemaining?: number;
  onCancel?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CancelSubscriptionButton({
  subscriptionId,
  hasCommitment = false,
  commitmentEndDate,
  monthsRemaining = 0,
  onCancel,
  variant = 'outline',
  size = 'default',
  className,
}: CancelSubscriptionButtonProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const queryClient = useQueryClient();

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await cancelSubscription();

      if (response.success) {
        toast.success(response.message);
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
        queryClient.invalidateQueries({ queryKey: ['subscription', 'cancellation-status'] });
        setShowCancelDialog(false);
        onCancel?.();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível cancelar a assinatura.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!subscriptionId) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowCancelDialog(true)}
        className={className}
      >
        <X className="h-4 w-4" />
        Cancelar assinatura
      </Button>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar cancelamento
            </DialogTitle>
            <DialogDescription>
              Esta ação agenda o cancelamento ao final do ciclo atual. Até lá você mantém acesso completo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm text-muted-foreground">
            {hasCommitment ? (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Seu plano possui compromisso anual. A assinatura será encerrada após
                  {' '}
                  {commitmentEndDate
                    ? new Date(commitmentEndDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'o término do compromisso'}
                  {monthsRemaining > 0 && (
                    <> ({monthsRemaining} {monthsRemaining === 1 ? 'mês' : 'meses'} restantes)</>
                  )}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Você continuará com acesso até o fim do período já pago. Depois disso, a cobrança será interrompida.
                </AlertDescription>
              </Alert>
            )}

            <ul className="space-y-1">
              <li>• Créditos não expiráveis permanecem na conta.</li>
              <li>• É possível reativar a assinatura a qualquer momento antes da data efetiva.</li>
              <li>• Recursos premium permanecem disponíveis até o cancelamento.</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Manter assinatura
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
              className="gap-2"
            >
              {isCancelling ? (
                <>
                  <X className="h-4 w-4 animate-pulse" />
                  Cancelando...
                </>
              ) : hasCommitment ? (
                'Agendar cancelamento'
              ) : (
                'Cancelar assinatura'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

