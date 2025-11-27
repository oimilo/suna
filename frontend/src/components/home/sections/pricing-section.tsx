'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { SectionHeader } from '@/components/home/section-header';
import { siteConfig, PricingTier } from '@/lib/home';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useAccountState } from '@/hooks/billing';
import { billingApi, CreateCheckoutSessionResponse } from '@/lib/api/billing';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

const MAILTO_ENTERPRISE = 'mailto:vendas@prophet.build?subject=Interesse%20no%20Plano%20Enterprise';

interface PricingSectionProps {
  returnUrl?: string;
  showTitleAndTabs?: boolean;
  showInfo?: boolean;
  onSubscriptionUpdate?: () => void;
  hideFree?: boolean;
  insideDialog?: boolean;
  noPadding?: boolean;
}

type BillingPeriod = 'monthly' | 'yearly';

interface BillingPeriodToggleProps {
  billingPeriod: BillingPeriod;
  setBillingPeriod: (period: BillingPeriod) => void;
}

const BillingPeriodToggle = ({ billingPeriod, setBillingPeriod }: BillingPeriodToggleProps) => (
  <div className="flex items-center justify-center">
    <div className="flex gap-2 rounded-lg bg-muted p-1">
      <button
        onClick={() => setBillingPeriod('monthly')}
        className={cn(
          'px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md',
          billingPeriod === 'monthly'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Mensal
      </button>
      <button
        onClick={() => setBillingPeriod('yearly')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md',
          billingPeriod === 'yearly'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Anual
        <Badge className="border-0 bg-green-500 text-[10px] font-semibold text-white">
          -15%
        </Badge>
      </button>
    </div>
  </div>
);

interface PricingTierCardProps {
  tier: PricingTier;
  billingPeriod: BillingPeriod;
  isCurrentPlan: boolean;
  isProcessing: boolean;
  isAuthenticated: boolean;
  onSelect: () => void;
}

const PricingTierCard = ({
  tier,
  billingPeriod,
  isCurrentPlan,
  isProcessing,
  isAuthenticated,
  onSelect,
}: PricingTierCardProps) => {
  const tierKey = tier.tierKey ?? tier.name;
  const displayPrice =
    billingPeriod === 'yearly' && tier.yearlyPrice ? tier.yearlyPrice : tier.price;
  const priceSuffix = billingPeriod === 'yearly' ? '/ano' : '/mês';
  const showMonthlyEquivalent = billingPeriod === 'yearly' && tier.price && tier.yearlyPrice && tier.price !== tier.yearlyPrice;

  const buttonLabel = (() => {
    if (isCurrentPlan) return 'Plano atual';
    if (isProcessing) return 'Processando...';
    if (!isAuthenticated && tierKey !== config.SUBSCRIPTION_TIERS.FREE_TIER.tierKey) return 'Começar agora';
    return tier.buttonText;
  })();

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="w-full"
    >
      <Card
        className={cn(
          'h-full border-border/40 bg-background/80 backdrop-blur-xl shadow-xl transition-colors',
          tier.isPopular && 'border-primary/70'
        )}
      >
        <CardContent className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
            </div>
            {tier.isPopular && (
              <Badge className="bg-primary/10 text-primary">Mais popular</Badge>
            )}
          </div>

          <div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">{displayPrice}</span>
              <span className="text-sm text-muted-foreground">{priceSuffix}</span>
            </div>
            {showMonthlyEquivalent && (
              <p className="mt-1 text-xs text-muted-foreground">Equivalente a {tier.price}/mês</p>
            )}
            {billingPeriod === 'yearly' && tier.originalYearlyPrice && (
              <p className="text-xs text-muted-foreground">
                Valor original {tier.originalYearlyPrice}/ano
              </p>
            )}
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-3">
            <Button
              onClick={onSelect}
              disabled={isProcessing || isCurrentPlan}
              className={cn(
                'w-full rounded-xl py-5 text-sm font-medium transition-transform duration-200 hover:scale-[1.01]',
                isCurrentPlan ? 'bg-muted text-muted-foreground' : tier.buttonColor
              )}
            >
              {buttonLabel}
            </Button>
            {isCurrentPlan && (
              <p className="text-xs text-center text-muted-foreground">
                Este é o seu plano atual.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function PricingSection({
  returnUrl,
  showTitleAndTabs = true,
  showInfo = true,
  onSubscriptionUpdate,
  hideFree = false,
  insideDialog = false,
  noPadding = false,
}: PricingSectionProps = {}) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: accountState } = useAccountState({ enabled: !!user });
  const subscriptionData = accountState?.subscription;
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  useEffect(() => {
    if (subscriptionData?.billing_period === 'yearly') {
      setBillingPeriod('yearly');
    }
  }, [subscriptionData?.billing_period]);

  const tiers = useMemo(
    () =>
      siteConfig.cloudPricingItems.filter(
        (tier) => !tier.hidden && (!hideFree || (tier.tierKey ?? tier.name) !== config.SUBSCRIPTION_TIERS.FREE_TIER.tierKey),
      ),
    [hideFree],
  );
  const currentTierKey = subscriptionData?.tier_key;

  const resolvedSuccessUrl =
    returnUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard');
  const resolvedCancelUrl =
    returnUrl ?? (typeof window !== 'undefined' ? window.location.href : siteConfig.url);

  const handleSubscribe = async (tier: PricingTier) => {
    const tierKey = tier.tierKey ?? tier.name;
    if (processingTier) return;

    if (tier.name.toLowerCase().includes('enterprise')) {
      window.location.href = MAILTO_ENTERPRISE;
      return;
    }

    if (!user) {
      router.push('/auth?mode=signup');
      return;
    }

    if (tierKey === config.SUBSCRIPTION_TIERS.FREE_TIER.tierKey) {
      router.push('/dashboard');
      toast.success('Plano gratuito ativo. Aproveite o Prophet!');
      return;
    }

    if (tierKey === currentTierKey) {
      toast.info('Você já está neste plano.');
      router.push('/dashboard');
      return;
    }

    const key = `${tierKey}-${billingPeriod}`;
    setProcessingTier(key);
    try {
      const successUrl = resolvedSuccessUrl;
      const cancelUrl = resolvedCancelUrl;
      const response: CreateCheckoutSessionResponse = await billingApi.createCheckoutSession({
        tier_key: tierKey,
        success_url: successUrl,
        cancel_url: cancelUrl,
        commitment_type: billingPeriod === 'yearly' ? 'yearly' : 'monthly',
      });

      if (response.url) {
        window.location.href = response.url;
        return;
      }

      if (response.status === 'updated' || response.status === 'upgraded') {
        toast.success(response.message ?? 'Assinatura atualizada com sucesso!');
        onSubscriptionUpdate?.();
      } else if (response.status === 'no_change') {
        toast.info(response.message ?? 'Você já está neste plano.');
      } else {
        toast.success(response.message ?? 'Processo concluído com sucesso.');
        onSubscriptionUpdate?.();
      }
    } catch (error: any) {
      console.error('Erro ao processar assinatura:', error);
      const message =
        error?.detail?.message ||
        error?.message ||
        'Falha ao processar assinatura. Por favor, tente novamente.';
      toast.error(message);
    } finally {
      setProcessingTier(null);
    }
  };

  return (
    <section
      id="pricing"
      className={cn(
        'relative z-10 w-full py-24',
        noPadding && 'py-8',
        insideDialog && 'py-6',
      )}
    >
      <div
        className={cn(
          'container px-4 md:px-8',
          noPadding && 'px-0',
          insideDialog && 'px-0',
        )}
      >
        {showTitleAndTabs && (
          <SectionHeader>
            <Badge className="bg-primary/10 text-primary">Planos flexíveis para todo time</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold text-center text-foreground">
              Escolha o melhor plano para sua equipe
            </h2>
            {showInfo && (
              <p className="text-base text-muted-foreground text-center max-w-xl">
                Créditos generosos, Workers ilimitados e integrações para você construir automações poderosas.
              </p>
            )}
          </SectionHeader>
        )}

        {showTitleAndTabs && (
          <div className="mt-10 flex justify-center">
            <BillingPeriodToggle billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod} />
          </div>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => {
            const tierKey = tier.tierKey ?? tier.name;
            return (
              <PricingTierCard
                key={tierKey}
                tier={tier}
                billingPeriod={billingPeriod}
                isCurrentPlan={tierKey === currentTierKey}
                isProcessing={processingTier === `${tierKey}-${billingPeriod}`}
                isAuthenticated={!!user}
                onSelect={() => handleSubscribe(tier)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
