'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { reactivateSubscription } from '@/lib/api/billing-v2';
import { subscriptionKeys } from '@/hooks/react-query/subscriptions/keys';

interface SubscriptionCancellationCardProps {
  subscription: {
    id: string;
    cancel_at?: string | number | null;
    canceled_at?: string | number | null;
    cancel_at_period_end?: boolean;
    current_period_end: string | number | null;
    status: string;
  } | null;
  hasCommitment?: boolean;
  commitmentEndDate?: string;
  onReactivate?: () => void;
}

export function SubscriptionCancellationCard({
  subscription,
  hasCommitment = false,
  commitmentEndDate,
  onReactivate,
}: SubscriptionCancellationCardProps) {
  const [isReactivating, setIsReactivating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const queryClient = useQueryClient();

  const isCancelled =
    subscription?.cancel_at || subscription?.canceled_at || subscription?.cancel_at_period_end;

  if (!subscription || !isCancelled) {
    return null;
  }

  const cancellationDate = (() => {
    if (subscription.cancel_at) {
      return typeof subscription.cancel_at === 'number'
        ? new Date(subscription.cancel_at * 1000)
        : new Date(subscription.cancel_at);
    }
    if (subscription.current_period_end) {
      if (typeof subscription.current_period_end === 'number') {
        return new Date(subscription.current_period_end * 1000);
      }
      if (typeof subscription.current_period_end === 'string') {
        return new Date(subscription.current_period_end);
      }
    }
    return new Date();
  })();

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const daysRemaining = Math.max(
    0,
    Math.ceil((cancellationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const response = await reactivateSubscription();

      if (response.success) {
        toast.success(response.message || 'Assinatura reativada com sucesso.');
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
        queryClient.invalidateQueries({ queryKey: ['subscription', 'cancellation-status'] });
        onReactivate?.();
      } else {
        toast.error(response.message || 'Não foi possível reativar a assinatura.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível reativar a assinatura.');
    } finally {
      setIsReactivating(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="space-y-4 py-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-muted-foreground">Sua assinatura será finalizada em:</span>
            </div>
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">
              {formatDate(cancellationDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              ({daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'})
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Você continuará com acesso total e poderá consumir os créditos até essa data. Após o cancelamento, para voltar a usar o Prophet será necessário reativar o plano.
          </p>

          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isReactivating}
            className="w-full"
          >
            {isReactivating ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Reativando...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Reativar assinatura
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja reativar agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao reativar, a cobrança e o ciclo atual continuam normalmente. Você pode cancelar novamente quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Manter cancelamento
            </Button>
            <Button onClick={handleReactivate} disabled={isReactivating}>
              {isReactivating ? 'Reativando...' : 'Confirmar reativação'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

