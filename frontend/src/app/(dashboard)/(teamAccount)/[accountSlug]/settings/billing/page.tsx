'use client';

import React, { useMemo } from 'react';
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
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { CreditPurchaseInline } from '@/components/billing/credit-purchase-inline';
import CreditTransactions from '@/components/billing/credit-transactions';
import { SubscriptionCancellationCard } from '@/components/billing/subscription-cancellation-card';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    .map((segment) => (segment ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : ''))
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

  const {
    data: teamAccount,
    isLoading,
    error,
  } = useAccountBySlug(accountSlug);

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
  const showDevTools = isStagingMode();

  const loadingTabs = subscriptionLoading || cancellationLoading || commitmentLoading;

  const planName = formatTierName(subscriptionData?.tier?.name);
  const planStatusKey = (subscriptionData?.subscription?.status || 'active').toLowerCase();
  const planStatusLabel = STATUS_LABELS[planStatusKey] || 'Ativo';
  const nextRenewal = subscriptionData?.subscription?.current_period_end
    ? new Date(subscriptionData.subscription.current_period_end)
    : null;

  const currentBalance = subscriptionData?.credits?.balance ?? 0;
  const monthlyAllowance = Number(subscriptionData?.credits?.tier_credits ?? subscriptionData?.tier?.credits ?? 0);
  const expiringCredits = transactionsData?.current_balance?.expiring ?? 0;
  const nonExpiringCredits = transactionsData?.current_balance?.non_expiring ?? 0;

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

  const balanceTab = (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-3xl border border-border/60 shadow-sm">
        <CardContent className="space-y-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
                Cobrança da equipe
              </p>
              <h2 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {teamAccount.name}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                A assinatura é compartilhada entre todos os membros da equipe. Reforce o saldo ou ajuste o plano para
                manter as automações em execução.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryPill label="Saldo disponível" value={formatCurrency(currentBalance)} />
              <SummaryPill label="Créditos expiráveis" value={formatCurrency(expiringCredits)} />
              <SummaryPill label="Créditos permanentes" value={formatCurrency(nonExpiringCredits)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" asChild>
              <Link href="#team-topup">Comprar créditos</Link>
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleOpenPortal}>
              <TrendingDown className="h-4 w-4" />
              Portal Stripe
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="team-topup" className="rounded-3xl border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Recarga rápida</CardTitle>
          <CardDescription>
            Proprietários podem comprar créditos ou configurar auto-reload direto no Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Auto-reload</p>
              <p className="text-xs text-muted-foreground">
                Defina limites de recarga automática intra-Stripe conforme o consumo da equipe.
              </p>
            </div>
            <Button variant="outline" onClick={handleOpenPortal} className="gap-2 sm:w-auto">
              <ShieldCheck className="h-4 w-4" />
              Configurar
            </Button>
          </div>
          <CreditPurchaseInline
            currentBalance={currentBalance}
            canPurchase={subscriptionData?.credits?.can_purchase_credits ?? false}
          />
        </CardContent>
      </Card>
    </div>
  );

  const historyTab = <CreditTransactions />;

  const planTab = (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{planName}</CardTitle>
            <CardDescription>Plano compartilhado entre todos os membros da equipe.</CardDescription>
          </div>
          <Badge
            className={cn(
              'border px-3 py-1 text-xs font-medium uppercase tracking-wide',
              STATUS_STYLE[planStatusKey] || STATUS_STYLE.active,
            )}
          >
            {planStatusLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow label="Próxima renovação" value={formatDate(nextRenewal)} />
            <DetailRow label="Créditos por ciclo" value={formatCurrency(monthlyAllowance)} />
            <DetailRow
              label="Compromisso"
              value={
                commitmentInfo?.has_commitment
                  ? `Até ${formatDate(
                      commitmentInfo.commitment_end_date ? new Date(commitmentInfo.commitment_end_date) : null,
                    )}`
                  : 'Sem compromisso fixo'
              }
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={handleOpenPortal}>
              <RefreshCw className="h-4 w-4" />
              Gerenciar no Stripe
            </Button>
            <Button variant="ghost" className="gap-2" onClick={handleTriggerRenewal} disabled={triggerTestRenewal.isPending}>
              {triggerTestRenewal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              Simular renovação
            </Button>
          </div>
        </CardContent>
      </Card>

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

      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Planos disponíveis</CardTitle>
          <CardDescription>Atualize o plano compartilhado para liberar mais créditos e recursos premium.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLocalMode() ? (
            <Alert>
              <AlertDescription>
                Em ambiente local a cobrança de equipe fica desabilitada. Utilize staging ou produção para validar upgrades.
              </AlertDescription>
            </Alert>
          ) : loadingTabs ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : subscriptionError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {subscriptionError instanceof Error
                  ? subscriptionError.message
                  : 'Não foi possível carregar as informações do plano.'}
              </AlertDescription>
            </Alert>
          ) : (
            <PricingSection
              returnUrl={`${returnUrl}/${accountSlug}/settings/billing`}
              showTitleAndTabs={false}
              insideDialog={false}
            />
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
            <CardDescription>Utilize estes atalhos apenas em ambientes de teste.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={handleTriggerRenewal} disabled={triggerTestRenewal.isPending}>
              {triggerTestRenewal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Simular renovação mensal
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleOpenPortal} disabled={createPortalSession.isPending}>
              {createPortalSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              Abrir portal Stripe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const invoicesTab = (
    <Card className="rounded-3xl border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Faturas e recibos da equipe</CardTitle>
        <CardDescription>Acesse comprovantes emitidos no Stripe ou entre em contato com o time financeiro.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-dashed border-border/60">
          <AlertDescription>
            Integração de faturas para equipes ainda não está disponível aqui. Utilize o portal do Stripe para baixar os
            comprovantes ou contate <a href="mailto:finance@prophet.build" className="underline">finance@prophet.build</a>.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleOpenPortal} className="gap-2">
          <TrendingDown className="h-4 w-4" />
          Abrir portal Stripe
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-14">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Cobrança da equipe</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Visualize e administre créditos, plano e histórico de faturamento compartilhado com todos os membros da equipe.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={cn('px-2 py-1 text-xs font-semibold uppercase tracking-wide', STATUS_STYLE[planStatusKey] || STATUS_STYLE.active)}>
              {planStatusLabel}
            </Badge>
            <span className="text-muted-foreground">Próxima renovação: {formatDate(nextRenewal)}</span>
          </div>
          <div className="text-muted-foreground">
            Plano atual: <span className="font-medium text-foreground">{planName}</span>
          </div>
        </div>
      </header>

      <Tabs defaultValue="balance" className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <TabsList className="flex h-fit flex-col gap-2 rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
          <TabsTrigger
            value="balance"
            className="justify-start text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Saldo & recarga
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="justify-start text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Histórico
          </TabsTrigger>
          <TabsTrigger
            value="plan"
            className="justify-start text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Plano & upgrades
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="justify-start text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Faturas
          </TabsTrigger>
        </TabsList>
        <div className="space-y-6">
          <TabsContent value="balance" className="space-y-6">
            {loadingTabs && !subscriptionData ? <Skeleton className="h-64 w-full" /> : balanceTab}
          </TabsContent>
          <TabsContent value="history" className="space-y-6">
            {transactionsLoading && !transactionsData ? <Skeleton className="h-64 w-full" /> : historyTab}
          </TabsContent>
          <TabsContent value="plan" className="space-y-6">
            {loadingTabs && !subscriptionData ? <Skeleton className="h-64 w-full" /> : planTab}
          </TabsContent>
          <TabsContent value="invoices" className="space-y-6">
            {invoicesTab}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

