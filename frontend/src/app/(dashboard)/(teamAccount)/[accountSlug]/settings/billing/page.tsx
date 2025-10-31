'use client';

import React, { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';

import { BillingModal } from '@/components/billing/billing-modal';
import { CancelSubscriptionButton } from '@/components/billing/cancel-subscription-button';
import { CreditBalanceCard } from '@/components/billing/credit-balance-card';
import { SubscriptionCancellationCard } from '@/components/billing/subscription-cancellation-card';
import { TrialManagement } from '@/components/dashboard/trial-management';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccounts } from '@/hooks/use-accounts';
import { useCancellationStatus } from '@/hooks/react-query/use-subscription-cancellation';
import { useSubscriptionCommitment } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

type AccountParams = {
  accountSlug: string;
};

export default function TeamBillingPage({
  params,
}: {
  params: Promise<AccountParams>;
}) {
  const unwrappedParams = React.use(params);
  const { accountSlug } = unwrappedParams;
  const [showBillingModal, setShowBillingModal] = useState(false);

  const { data: accounts, isLoading, error } = useAccounts();

  const teamAccount = useMemo(
    () =>
      accounts?.find((account) => {
        if (account.slug === accountSlug) {
          return true;
        }
        if ('account_slug' in account && typeof (account as any).account_slug === 'string') {
          return (account as any).account_slug === accountSlug;
        }
        return false;
      }),
    [accounts, accountSlug],
  );

  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useSharedSubscription();

  const {
    data: cancellationStatus,
    refetch: refetchCancellation,
  } = useCancellationStatus();

  const { data: commitmentInfo } = useSubscriptionCommitment(
    subscriptionData?.subscription?.id || undefined,
  );

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-300 dark:border-red-800 rounded-xl">
        <AlertTitle>Erro ao carregar contas</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Não foi possível carregar os dados da equipe.'}
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

  if (!teamAccount) {
    return (
      <Alert variant="destructive" className="border-red-300 dark:border-red-800 rounded-xl">
        <AlertTitle>Conta não encontrada</AlertTitle>
        <AlertDescription>Não encontramos a conta da equipe informada.</AlertDescription>
      </Alert>
    );
  }

  const teamRole = teamAccount.role ?? (teamAccount as any).account_role;

  if (teamRole !== 'owner') {
    return (
      <Alert variant="destructive" className="border-red-300 dark:border-red-800 rounded-xl">
        <AlertTitle>Acesso negado</AlertTitle>
        <AlertDescription>
          Apenas o proprietário da equipe pode gerenciar a cobrança coletiva.
        </AlertDescription>
      </Alert>
    );
  }

  const isSubscriptionLoading = subscriptionLoading && !subscriptionData;

  return (
    <div className="space-y-6">
      <BillingModal
        open={showBillingModal}
        onOpenChange={(open) => {
          setShowBillingModal(open);
          if (!open) {
            refetchSubscription();
            refetchCancellation();
          }
        }}
        returnUrl={`${returnUrl}/${accountSlug}/settings/billing`}
      />

      <div>
        <h3 className="text-lg font-medium text-card-title">Cobrança da equipe</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie o plano compartilhado entre os membros desta equipe.
        </p>
      </div>

      <TrialManagement />

      <Card className="rounded-xl border shadow-sm bg-card">
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-xl font-semibold">Status da assinatura</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acompanhe o saldo disponível, a próxima renovação e realize ajustes rápidos.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isSubscriptionLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : subscriptionError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {subscriptionError instanceof Error
                  ? subscriptionError.message
                  : 'Não foi possível carregar os dados da assinatura da equipe.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <CreditBalanceCard
                showPurchaseButton={subscriptionData?.credits?.can_purchase_credits ?? false}
                tierCredits={subscriptionData?.credits?.tier_credits}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="w-full" onClick={() => setShowBillingModal(true)}>
                  Ajustar plano da equipe
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowBillingModal(true)}
                >
                  Comprar créditos extras
                </Button>
              </div>

              {cancellationStatus?.has_subscription && cancellationStatus.is_cancelled && (
                <SubscriptionCancellationCard
                  subscription={{
                    id: cancellationStatus.subscription_id || subscriptionData?.subscription?.id || '',
                    cancel_at: cancellationStatus.cancel_at,
                    cancel_at_period_end: cancellationStatus.cancel_at_period_end,
                    current_period_end: cancellationStatus.current_period_end,
                    status: cancellationStatus.status || subscriptionData?.subscription?.status || '',
                  }}
                  hasCommitment={commitmentInfo?.has_commitment}
                  commitmentEndDate={commitmentInfo?.commitment_end_date}
                  onReactivate={() => {
                    refetchSubscription();
                    refetchCancellation();
                  }}
                />
              )}

              {cancellationStatus?.has_subscription &&
                !cancellationStatus?.is_cancelled &&
                subscriptionData?.subscription?.id && (
                  <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
    </div>
  );
}
