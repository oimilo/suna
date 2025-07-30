'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { isLocalMode } from '@/lib/config';
import { createPortalSession } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/react-query';
import Link from 'next/link';
import { OpenInNewWindowIcon } from '@radix-ui/react-icons';

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

  const proPriceIds = [
    'price_1RqK0hFNfWjTbEjsaAFuY7Cb', // Pro Monthly
    'price_1RqK0hFNfWjTbEjsN9XCGLA4', // Pro Yearly
  ];
  
  const proMaxPriceIds = [
    'price_1RqK4xFNfWjTbEjsCrjfvJVL', // Pro Max Monthly
    'price_1RqK6cFNfWjTbEjs75UPIgif', // Pro Max Yearly
  ];

  const getPlanName = () => {
    // Debug log to see what we're receiving
    console.log('Subscription data:', {
      price_id: subscriptionData?.price_id,
      plan_name: subscriptionData?.plan_name,
      status: subscriptionData?.status,
      cost_limit: subscriptionData?.cost_limit
    });
    
    // Check new price IDs first
    if (subscriptionData?.price_id) {
      if (proPriceIds.includes(subscriptionData.price_id)) return 'Pro';
      if (proMaxPriceIds.includes(subscriptionData.price_id)) return 'Pro Max';
    }
    
    // Check legacy plan names
    if (subscriptionData?.plan_name) {
      if (subscriptionData.plan_name === 'base') return 'Pro';
      if (subscriptionData.plan_name === 'extra') return 'Pro Max';
      if (subscriptionData.plan_name === 'enterprise') return 'Enterprise';
    }
    
    // Check if there's an active subscription even without matching price_id (manual assignment case)
    if (subscriptionData?.status === 'active' || subscriptionData?.status === 'trialing') {
      // If we have a cost limit > 5, it's likely a paid plan
      const costLimit = subscriptionData.cost_limit || 0;
      if (costLimit > 5) return 'Pro';
    }
    
    // Fallback: If there's ANY price_id set (even custom ones) and it's not a known free plan
    // This handles cases where plans are assigned via CLI with custom price IDs
    if (subscriptionData?.price_id && subscriptionData?.price_id !== '') {
      // If it's not in any of our known lists, check by plan_name or cost_limit
      if (subscriptionData.plan_name === 'free' && (subscriptionData.cost_limit || 0) <= 5) {
        return 'Gratuito';
      }
      // Assume it's at least Pro if it has a price_id but isn't explicitly free
      return 'Pro';
    }
    
    return 'Gratuito';
  };

  const planName = getPlanName();

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
                  Uso de Agentes Este Mês
                </span>
                <span className="text-sm font-medium text-card-title">
                  ${subscriptionData.current_usage?.toFixed(2) || '0'} /{' '}
                  ${subscriptionData.cost_limit || '0'}
                </span>
                <Button variant='outline' asChild className='text-sm'>
                  <Link href="/settings/usage-logs">
                    Logs de uso
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Plans Comparison */}
          <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} insideDialog={true} />

          <div className="mt-20"></div>
          {/* Manage Subscription Button */}
          <div className='flex justify-center items-center gap-4'>
            <Button
              variant="outline"
              className="border-border hover:bg-muted/50 shadow-sm hover:shadow-md transition-all whitespace-nowrap flex items-center"
            >
              <Link href="/model-pricing">
                Ver Preços dos Modelos <OpenInNewWindowIcon className='w-4 h-4 inline ml-2' />
              </Link>
            </Button>
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
                  Uso de Agentes Este Mês
                </span>
                <span className="text-sm font-medium text-card-title">
                  ${subscriptionData?.current_usage?.toFixed(2) || '0'} /{' '}
                  ${subscriptionData?.cost_limit || '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Plans Comparison */}
          <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} insideDialog={true} />

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => window.open('/model-pricing', '_blank')}
              variant="outline"
              className="w-full border-border hover:bg-muted/50 shadow-sm hover:shadow-md transition-all"
            >
              Ver Preços dos Modelos
            </Button>
            <Button
              onClick={handleManageSubscription}
              disabled={isManaging}
              className="w-full bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            >
              {isManaging ? 'Carregando...' : 'Gerenciar Assinatura'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
