'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { isLocalMode } from '@/lib/config';
import { createPortalSession } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription, useCreditsStatus } from '@/hooks/react-query';
import Link from 'next/link';
import { getPlanDisplayName } from '@/lib/subscription-utils';
import { Sparkles } from 'lucide-react';

type Props = {
  accountId: string;
  returnUrl: string;
};

export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
  const { session, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const {
    data: subscriptionData,
    isLoading,
    error: subscriptionQueryError,
  } = useSubscription();
  const { data: creditsData } = useCreditsStatus();

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      const { url } = await createPortalSession({ return_url: returnUrl });
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create portal session:', err);
      setError(
        err instanceof Error ? err.message : 'Falha ao criar sessão do portal',
      );
    } finally {
      setIsManaging(false);
    }
  };

  // In local development mode, show a simplified component
  if (isLocalMode()) {
    return (
      <div className="rounded-xl border shadow-sm bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Status de Cobrança</h2>
        <div className="p-4 mb-4 bg-muted/30 border border-border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Executando em modo de desenvolvimento local - recursos de cobrança desabilitados
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Limites de uso de agentes não são aplicados neste ambiente
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading || authLoading) {
    return (
      <div className="rounded-xl border shadow-sm bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Status de Cobrança</h2>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || subscriptionQueryError) {
    return (
      <div className="rounded-xl border shadow-sm bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Status de Cobrança</h2>
        <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <p className="text-sm text-destructive">
            Erro ao carregar status de cobrança:{' '}
            {error || subscriptionQueryError.message}
          </p>
        </div>
      </div>
    );
  }

  const planName = getPlanDisplayName(subscriptionData);

  return (
    <div className="rounded-xl border shadow-sm bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">Status de Cobrança</h2>

      {subscriptionData ? (
        <>
          <div className="mb-6">
            <div className="rounded-lg border bg-background p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground/90">
                  Plano Atual
                </span>
                <span className="text-sm font-medium text-card-title">
                  {planName}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm font-medium text-foreground/90">
                  Créditos Este Mês
                </span>
                <div className="flex items-center gap-3">
                  {creditsData ? (
                    <>
                      <span className="text-sm font-medium text-card-title">
                        {Math.floor(creditsData.tier_credits_used).toLocaleString('pt-BR')} /{' '}
                        {Math.floor(creditsData.tier_credits_limit).toLocaleString('pt-BR')}
                      </span>
                      {creditsData.daily_credits > 0 && (
                        <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          +{Math.floor(creditsData.daily_credits)} diários
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-medium text-card-title">
                      ${subscriptionData.current_usage?.toFixed(2) || '0'} /{' '}
                      ${subscriptionData.cost_limit || '0'}
                    </span>
                  )}
                  <Button variant='outline' asChild className='text-sm'>
                    <Link href="/settings/usage-logs">
                      Logs de uso
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Comparison */}
          <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} insideDialog={true} />

          <div className="mt-20"></div>
          {/* Manage Subscription Button */}
          <div className='flex justify-center items-center'>
            <Button
              onClick={handleManageSubscription}
              disabled={isManaging}
              className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            >
              {isManaging ? 'Carregando...' : 'Gerenciar Assinatura'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <div className="rounded-lg border bg-background p-4 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground/90">
                  Plano Atual
                </span>
                <span className="text-sm font-medium text-card-title">
                  Gratuito
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground/90">
                  Créditos Este Mês
                </span>
                <div className="flex items-center gap-3">
                  {creditsData ? (
                    <>
                      <span className="text-sm font-medium text-card-title">
                        {Math.floor(creditsData.tier_credits_used).toLocaleString('pt-BR')} /{' '}
                        {Math.floor(creditsData.tier_credits_limit).toLocaleString('pt-BR')}
                      </span>
                      {creditsData.daily_credits > 0 && (
                        <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          +{Math.floor(creditsData.daily_credits)} diários
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-medium text-card-title">
                      ${subscriptionData?.current_usage?.toFixed(2) || '0'} /{' '}
                      ${subscriptionData?.cost_limit || '0'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Plans Comparison */}
          <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} insideDialog={true} />

          {/* Action Buttons */}
          <div className="flex justify-center items-center">
            <Button
              onClick={handleManageSubscription}
              disabled={isManaging}
              className="bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            >
              {isManaging ? 'Carregando...' : 'Gerenciar Assinatura'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
