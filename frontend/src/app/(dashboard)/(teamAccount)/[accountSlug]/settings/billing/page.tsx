'use client';

import React, { useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Infinity,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { CreditPurchaseInline } from '@/components/billing/credit-purchase-inline';
import { SubscriptionCancellationCard } from '@/components/billing/subscription-cancellation-card';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { useAccountBySlug } from '@/hooks/react-query';
import { useTransactions } from '@/hooks/react-query/billing/use-transactions';
import { useCancellationStatus } from '@/hooks/react-query/use-subscription-cancellation';
import { useSubscriptionCommitment } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { useCreatePortalSession, useTriggerTestRenewal } from '@/hooks/react-query/use-billing-v2';
import { isLocalMode, isStagingMode } from '@/lib/config';
import { cn } from '@/lib/utils';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em teste',
  past_due: 'Em atraso',
  canceled: 'Cancelada',
  unpaid: 'Pendente',
  incomplete: 'Incompleta',
  incomplete_expired: 'Expirada',
};

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-500/20',
  trialing: 'bg-indigo-100/60 text-indigo-700 border-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-300 dark:border-indigo-500/20',
  past_due: 'bg-amber-100/60 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-500/20',
  canceled: 'bg-rose-100/60 text-rose-700 border-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-500/20',
  unpaid: 'bg-amber-100/60 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-500/20',
  incomplete: 'bg-amber-100/60 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-500/20',
  incomplete_expired: 'bg-rose-100/60 text-rose-700 border-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-500/20',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const formatDate = (date: Date | null | undefined) =>
  date
    ? date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

const formatTierName = (value?: string | null) => {
  if (!value) return 'Plano ativo';
  const cleaned = value.replace(/^tier_/i, '').replace(/_/g, ' ').trim();
  if (!cleaned) return 'Plano ativo';
  return cleaned
    .split(' ')
    .map((segment) => segment ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : '')
    .join(' ');
};

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

  const topUpSectionRef = useRef<HTMLDivElement>(null);
  const plansSectionRef = useRef<HTMLDivElement>(null);

  const { data: teamAccount, isLoading, error } = useAccountBySlug(accountSlug);
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
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
  } = useTransactions(10, 0);

  const createPortalSession = useCreatePortalSession();
  const triggerTestRenewal = useTriggerTestRenewal();
  const showLoadingCard = subscriptionLoading || cancellationLoading || commitmentLoading;
  const showDevTools = isStagingMode();

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
        <AlertDescription>A conta de equipe solicitada não pôde ser localizada.</AlertDescription>
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

  const handleScrollToTopUp = () => {
    topUpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScrollToPlans = () => {
    plansSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOpenPortal = () => {
    if (createPortalSession.isPending) return;

    createPortalSession.mutate(
      { return_url: `${returnUrl}/${accountSlug}/settings/billing` },
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

  const balanceData = subscriptionData?.credits;
  const currentBalance = balanceData?.balance ?? 0;
  const monthlyAllowance = Number(balanceData?.tier_credits ?? subscriptionData?.tier?.credits ?? 0);
  const expiringCredits = transactionsData?.current_balance?.expiring ?? 0;
  const nonExpiringCredits = transactionsData?.current_balance?.non_expiring ?? 0;

  const planName = formatTierName(subscriptionData?.tier?.name);
  const planStatusKey = (subscriptionData?.subscription?.status || 'active').toLowerCase();
  const planStatusLabel = STATUS_LABELS[planStatusKey] || 'Ativo';
  const nextRenewal = subscriptionData?.subscription?.current_period_end
    ? new Date(subscriptionData.subscription.current_period_end)
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-14">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-background shadow-lg">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -left-1/4 top-0 h-[140%] w-[140%] rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-[-30%] right-[-10%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-between gap-10 p-8 lg:p-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
                <Users className="h-4 w-4" />
                Cobrança da equipe
              </div>
              <p className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {teamAccount.name}
              </p>
              <p className="max-w-xl text-sm text-muted-foreground/90">
                Este painel reflete a assinatura compartilhada entre todos os membros da equipe. Ajustes realizados aqui
                impactam o consumo coletivo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Saldo disponível</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(currentBalance)}</p>
                <p className="text-xs text-muted-foreground">Disponível para consumo imediato</p>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Créditos expiráveis</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(expiringCredits)}</p>
                <p className="text-xs text-muted-foreground">Renovam com o ciclo atual</p>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Créditos permanentes</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(nonExpiringCredits)}</p>
                <p className="text-xs text-muted-foreground">Reservados para uso futuro</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleScrollToTopUp} className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Comprar créditos
              </Button>
              <Button variant="outline" onClick={handleScrollToPlans} className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Atualizar plano
              </Button>
              <Button variant="ghost" onClick={handleOpenPortal} className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Portal Stripe
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center justify-between gap-3 text-base font-semibold">
              <span>Plano compartilhado</span>
              <Badge
                className={cn(
                  'border px-3 py-1 text-xs font-medium uppercase tracking-wide',
                  STATUS_STYLE[planStatusKey] || STATUS_STYLE.active,
                )}
              >
                {planStatusLabel}
              </Badge>
            </CardTitle>
            <CardDescription>
              Assinatura ativa para a equipe. Altere limites ou configure automações de pagamento abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-semibold text-foreground">{planName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Concede {monthlyAllowance ? formatCurrency(monthlyAllowance) : '—'} em créditos por ciclo mensal.
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/90 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Próxima renovação</span>
                <span className="font-medium text-foreground">{formatDate(nextRenewal)}</span>
              </div>
              {commitmentInfo?.has_commitment && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Compromisso anual</span>
                  <span className="font-medium text-foreground">
                    Até {formatDate(commitmentInfo.commitment_end_date ? new Date(commitmentInfo.commitment_end_date) : null)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleOpenPortal} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Gerenciar no Stripe
              </Button>
              <Button variant="ghost" onClick={handleScrollToPlans} className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Ajustar limites
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

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

      <section
        ref={topUpSectionRef}
        className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:p-8"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Reforçar créditos da equipe</CardTitle>
            <CardDescription>
              Disponível para administradores e proprietários. As compras impactam todos os membros.
            </CardDescription>
          </div>
          <Button variant="ghost" className="gap-2" onClick={handleOpenPortal}>
            <ShieldCheck className="h-4 w-4" />
            Configurar auto-recarga
          </Button>
        </div>
        <div className="mt-6">
          <CreditPurchaseInline
            currentBalance={currentBalance}
            canPurchase={balanceData?.can_purchase_credits ?? false}
          />
        </div>
      </section>

      <section
        ref={plansSectionRef}
        className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:p-8"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Planos e upgrades da equipe</CardTitle>
            <CardDescription>
              Atualize o plano compartilhado para liberar mais créditos e recursos premium.
            </CardDescription>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleOpenPortal}>
            <RefreshCw className="h-4 w-4" />
            Gerenciar assinatura
          </Button>
        </div>
        {isLocalMode() ? (
          <Alert className="mt-6 border border-border/60 bg-muted/40">
            <AlertDescription>
              Em ambiente local, a cobrança de equipe está desabilitada. Utilize staging ou produção para testar o fluxo completo.
            </AlertDescription>
          </Alert>
        ) : showLoadingCard ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : subscriptionError ? (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              {subscriptionError instanceof Error
                ? subscriptionError.message
                : 'Não foi possível carregar os dados de assinatura.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="mt-6">
            <PricingSection
              returnUrl={`${returnUrl}/${accountSlug}/settings/billing`}
              showTitleAndTabs={false}
              insideDialog={false}
            />
          </div>
        )}
      </section>

      <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg font-semibold">Histórico coletivo</CardTitle>
          <CardDescription>
            Créditos adicionados e utilizados pela equipe. Consulte a aba de transações para o extrato completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="py-2 text-left font-medium">Data</th>
                    <th className="py-2 text-left font-medium">Tipo</th>
                    <th className="py-2 text-right font-medium">Valor</th>
                    <th className="py-2 text-right font-medium">Saldo após</th>
                  </tr>
                </thead>
                <tbody>
                  {(transactionsData?.transactions ?? []).slice(0, 6).map((transaction) => {
                    const createdAt = new Date(transaction.created_at);
                    return (
                      <tr key={transaction.id} className="border-b border-border/40 last:border-b-0">
                        <td className="py-3 text-left text-muted-foreground">
                          {createdAt.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 text-left text-foreground">{transaction.type}</td>
                        <td className="py-3 text-right font-medium text-foreground">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {formatCurrency(transaction.balance_after)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button variant="link" className="px-0" asChild>
              <Link href={`/${accountSlug}/settings/transactions`}>Ver transações</Link>
            </Button>
          </div>
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
              Atalhos rápidos para validações de assinatura.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2"
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
              className="gap-2"
              onClick={handleOpenPortal}
              disabled={createPortalSession.isPending}
            >
              {createPortalSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              Abrir portal Stripe
            </Button>
            <Button variant="ghost" className="gap-2" onClick={handleScrollToPlans}>
              <TrendingUp className="h-4 w-4" />
              Ir para planos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

