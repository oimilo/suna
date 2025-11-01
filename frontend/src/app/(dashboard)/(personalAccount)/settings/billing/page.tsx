'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Infinity,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { BillingModal } from '@/components/billing/billing-modal';
import { CancelSubscriptionButton } from '@/components/billing/cancel-subscription-button';
import { CreditBalanceCard } from '@/components/billing/credit-balance-card';
import { SubscriptionCancellationCard } from '@/components/billing/subscription-cancellation-card';
import { TrialManagement } from '@/components/dashboard/trial-management';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/react-query/billing/use-transactions';
import { useCancellationStatus } from '@/hooks/react-query/use-subscription-cancellation';
import { useSubscriptionCommitment } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { useCreatePortalSession, useTriggerTestRenewal } from '@/hooks/react-query/use-billing-v2';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { isLocalMode, isStagingMode } from '@/lib/config';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export default function PersonalAccountBillingPage() {
  const { data: accounts, isLoading, error } = useAccounts();
  const [showBillingModal, setShowBillingModal] = useState(false);

  const createPortalSession = useCreatePortalSession();
  const triggerTestRenewal = useTriggerTestRenewal();

  const personalAccount = useMemo(
    () => accounts?.find((account) => account.personal_account),
    [accounts],
  );

  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useSharedSubscription();

  const {
    data: cancellationStatus,
    isLoading: cancellationLoading,
    refetch: refetchCancellation,
  } = useCancellationStatus();

  const {
    data: commitmentInfo,
    isLoading: commitmentLoading,
  } = useSubscriptionCommitment(subscriptionData?.subscription?.id || undefined);

  const { data: transactionSnapshot } = useTransactions(1, 0);

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-300 dark:border-red-800 rounded-xl">
        <AlertTitle>Erro ao carregar conta</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Não foi possível carregar os dados da conta.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!personalAccount) {
    return (
      <Alert variant="destructive" className="border-red-300 dark:border-red-800 rounded-xl">
        <AlertTitle>Conta não encontrada</AlertTitle>
        <AlertDescription>
          Não localizamos a sua conta pessoal.
        </AlertDescription>
      </Alert>
    );
  }

  const showLoadingCard = subscriptionLoading || cancellationLoading || commitmentLoading;
  const showDevTools = isStagingMode();

  const handleBillingModal = (open: boolean) => {
    setShowBillingModal(open);
    if (!open) {
      refetchCancellation();
      refetchSubscription();
    }
  };

  const handleOpenPortal = () => {
    if (createPortalSession.isPending) return;

    createPortalSession.mutate(
      { return_url: `${returnUrl}/settings/billing` },
      {
        onError: (err: any) => {
          const message = err?.message || 'Não foi possível abrir o portal de cobrança.';
          toast.error(message);
        },
      },
    );
  };

  const handleTriggerRenewal = () => {
    if (triggerTestRenewal.isPending) return;

    triggerTestRenewal.mutate(undefined, {
      onSuccess: () => {
        toast.success('Renovação simulada disparada com sucesso.');
        refetchSubscription();
        refetchCancellation();
      },
      onError: (err: any) => {
        const message = err?.message || 'Falha ao disparar a renovação simulada.';
        toast.error(message);
      },
    });
  };

  const balance = subscriptionData?.credits;
  const currentBalance = transactionSnapshot?.current_balance;

  return (
    <div className="space-y-6">
      <BillingModal
        open={showBillingModal}
        onOpenChange={handleBillingModal}
        returnUrl={`${returnUrl}/settings/billing`}
      />

      <TrialManagement />

      {cancellationStatus?.has_subscription && cancellationStatus.is_cancelled && (
        <SubscriptionCancellationCard
          subscription={{
            id: cancellationStatus.subscription_id || subscriptionData?.subscription?.id || '',
            cancel_at: cancellationStatus.cancel_at,
            canceled_at: cancellationStatus.canceled_at,
            cancel_at_period_end: cancellationStatus.cancel_at_period_end,
            current_period_end:
              cancellationStatus.current_period_end || subscriptionData?.subscription?.current_period_end || null,
            status: cancellationStatus.status || subscriptionData?.subscription?.status || '',
          }}
          hasCommitment={commitmentInfo?.has_commitment}
          commitmentEndDate={commitmentInfo?.commitment_end_date}
          onReactivate={() => {
            refetchSubscription();
            refetchCancellation();
            toast.success('Assinatura reativada com sucesso.');
          }}
        />
      )}

      <Card className="rounded-xl border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Status da Cobrança</CardTitle>
          <CardDescription>
            Acompanhe créditos, renovações e ações rápidas da sua assinatura pessoal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLocalMode() ? (
            <div className="p-4 bg-muted/30 border border-border rounded-lg text-center text-sm text-muted-foreground">
              Executando em modo local: verificações de cobrança e limites de uso estão desabilitados.
            </div>
          ) : showLoadingCard ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : subscriptionError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {subscriptionError instanceof Error
                  ? subscriptionError.message
                  : 'Não foi possível carregar os dados de assinatura.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-4">
                <CreditBalanceCard
                  showPurchaseButton={balance?.can_purchase_credits ?? false}
                  tierCredits={balance?.tier_credits}
                />

                {currentBalance && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo total</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        ${currentBalance.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-xs uppercase tracking-wide">Créditos que expiram</span>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-amber-500">
                        ${currentBalance.expiring.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Infinity className="h-4 w-4 text-blue-500" />
                        <span className="text-xs uppercase tracking-wide">Créditos permanentes</span>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-blue-500">
                        ${currentBalance.non_expiring.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href="/model-pricing">Ver preços dos modelos</Link>
                </Button>
                <Button className="w-full sm:w-auto" onClick={() => setShowBillingModal(true)}>
                  Gerenciar plano e créditos
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowBillingModal(true)}>
                  Comprar créditos adicionais
                </Button>
              </div>

              {cancellationStatus?.has_subscription &&
                !cancellationStatus.is_cancelled &&
                subscriptionData?.subscription?.id &&
                subscriptionData.subscription.status !== 'trialing' && (
                  <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Próxima renovação em{' '}
                      {subscriptionData.subscription.current_period_end
                        ? new Date(
                            subscriptionData.subscription.current_period_end,
                          ).toLocaleDateString('pt-BR')
                        : 'data indefinida'}
                    </div>
                    <CancelSubscriptionButton
                      subscriptionId={subscriptionData.subscription.id}
                      hasCommitment={commitmentInfo?.has_commitment}
                      commitmentEndDate={commitmentInfo?.commitment_end_date}
                      monthsRemaining={commitmentInfo?.months_remaining}
                      onCancel={() => {
                        refetchSubscription();
                        refetchCancellation();
                      }}
                      variant="outline"
                      className="w-full sm:w-auto"
                    />
                  </div>
                )}
            </>
          )}
        </CardContent>
      </Card>

      {showDevTools && (
        <Card className="border border-dashed border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Ferramentas internas (staging)
            </CardTitle>
            <CardDescription>
              Atalhos para validar cenários de assinatura durante testes em staging.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2"
              onClick={handleTriggerRenewal}
              disabled={triggerTestRenewal.isPending}
            >
              {triggerTestRenewal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Simular renovação mensal
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2"
              onClick={handleOpenPortal}
              disabled={createPortalSession.isPending}
            >
              {createPortalSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Abrir portal Stripe
            </Button>
            <Button variant="outline" className="w-full sm:w-auto gap-2" asChild>
              <Link href="/settings/transactions">
                <TrendingDown className="h-4 w-4" />
                Ver histórico de créditos
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

