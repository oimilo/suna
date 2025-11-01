'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BillingModal } from '@/components/billing/billing-modal';
import { CreditBalanceCard } from '@/components/billing/credit-balance-card';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { useAccountBySlug } from '@/hooks/react-query';
import { useTransactions } from '@/hooks/react-query/billing/use-transactions';
import { isLocalMode } from '@/lib/config';

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

  const { data: teamAccount, isLoading, error } = useAccountBySlug(accountSlug);

  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSharedSubscription();

  const { data: transactionSnapshot } = useTransactions(1, 0);

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-300 dark:border-red-800 rounded-xl">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Falha ao carregar dados da equipe.'}
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
        <AlertDescription>
          A conta de equipe solicitada não pôde ser localizada.
        </AlertDescription>
      </Alert>
    );
  }

  if (teamAccount.role !== 'owner') {
    return (
      <Alert variant="destructive" className="border-red-300 dark:border-red-800 rounded-xl">
        <AlertTitle>Acesso negado</AlertTitle>
        <AlertDescription>
          Apenas o proprietário da equipe pode gerenciar as configurações de cobrança.
        </AlertDescription>
      </Alert>
    );
  }

  const handleBillingModal = (open: boolean) => {
    setShowBillingModal(open);
  };

  const currentBalance = transactionSnapshot?.current_balance;

  return (
    <div className="space-y-6">
      <BillingModal
        open={showBillingModal}
        onOpenChange={handleBillingModal}
        returnUrl={`${returnUrl}/${accountSlug}/settings/billing`}
      />

      <div>
        <h3 className="text-lg font-medium text-card-title">Cobrança da equipe</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie a assinatura compartilhada entre todos os membros desta equipe.
        </p>
      </div>

      <Card className="rounded-xl border shadow-sm bg-card">
        <CardHeader>
          <CardTitle>Status da cobrança</CardTitle>
          <CardDescription>
            Visão geral do saldo disponível e atalhos de gerenciamento do plano da equipe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLocalMode() ? (
            <div className="p-4 bg-muted/30 border border-border rounded-lg text-center text-sm text-muted-foreground">
              Executando em modo local: limites e cobranças não são aplicados neste ambiente.
            </div>
          ) : subscriptionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : subscriptionError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {subscriptionError instanceof Error
                  ? subscriptionError.message
                  : 'Não foi possível carregar as informações de assinatura.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <CreditBalanceCard
                showPurchaseButton={subscriptionData?.credits?.can_purchase_credits ?? false}
                tierCredits={subscriptionData?.credits?.tier_credits}
              />

              {currentBalance && (
                <div className="rounded-xl border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground/80">
                      Uso de créditos este mês
                    </span>
                    <span className="text-sm font-semibold">
                      {subscriptionData?.credits?.lifetime_used?.toFixed(2) || '0.00'} /{' '}
                      {subscriptionData?.credits?.tier_credits?.toFixed(2) || '0.00'}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings/transactions">Ver histórico</Link>
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="w-full sm:w-auto" onClick={() => setShowBillingModal(true)}>
                  Gerenciar plano e créditos
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setShowBillingModal(true)}
                >
                  Comprar créditos adicionais
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href="/model-pricing">Ver preços dos modelos</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

