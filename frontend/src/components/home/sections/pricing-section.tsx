'use client';

import { SectionHeader } from '@/components/home/section-header';
import type { PricingTier } from '@/lib/home';
import { siteConfig } from '@/lib/home';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { CheckIcon, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  createCheckoutSession,
  SubscriptionStatus,
  CreateCheckoutSessionResponse,
} from '@/lib/api';
import { toast } from 'sonner';
import { isLocalMode } from '@/lib/config';
import { useSubscription } from '@/hooks/react-query';

// Constants
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'base',
  ENTERPRISE: 'extra',
};

// Types
type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'link'
  | null;

interface PricingTabsProps {
  activeTab: 'cloud' | 'self-hosted';
  setActiveTab: (tab: 'cloud' | 'self-hosted') => void;
  className?: string;
}

interface PriceDisplayProps {
  price: string;
  isCompact?: boolean;
}

interface PricingTierProps {
  tier: PricingTier;
  isCompact?: boolean;
  currentSubscription: SubscriptionStatus | null;
  isLoading: Record<string, boolean>;
  isFetchingPlan: boolean;
  selectedPlan?: string;
  onPlanSelect?: (planId: string) => void;
  onSubscriptionUpdate?: () => void;
  isAuthenticated?: boolean;
  returnUrl: string;
  insideDialog?: boolean;
  billingPeriod?: 'monthly' | 'yearly';
}

// Components
function PricingTabs({ activeTab, setActiveTab, className }: PricingTabsProps) {
  return (
    <div
      className={cn(
        'relative flex w-fit items-center rounded-full border p-0.5 backdrop-blur-sm cursor-pointer h-9 flex-row bg-muted',
        className,
      )}
    >
      {['cloud', 'self-hosted'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as 'cloud' | 'self-hosted')}
          className={cn(
            'relative z-[1] px-3 h-8 flex items-center justify-center cursor-pointer',
            {
              'z-0': activeTab === tab,
            },
          )}
        >
          {activeTab === tab && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-full bg-white dark:bg-[#3F3F46] shadow-md border border-border"
              transition={{
                duration: 0.2,
                type: 'spring',
                stiffness: 300,
                damping: 25,
                velocity: 2,
              }}
            />
          )}
          <span
            className={cn(
              'relative block text-sm font-medium duration-200 shrink-0',
              activeTab === tab ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {tab === 'cloud' ? 'Cloud' : 'Self-hosted'}
          </span>
        </button>
      ))}
    </div>
  );
}

function PriceDisplay({ price, isCompact }: PriceDisplayProps) {
  return (
    <motion.span
      key={price}
      className={isCompact ? 'text-xl font-semibold' : 'text-3xl font-bold'}
      initial={{
        opacity: 0,
        x: 10,
        filter: 'blur(5px)',
      }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {price}
    </motion.span>
  );
}

function BillingPeriodToggle({
  billingPeriod,
  setBillingPeriod
}: {
  billingPeriod: 'monthly' | 'yearly';
  setBillingPeriod: (period: 'monthly' | 'yearly') => void;
}) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
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
            "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
            billingPeriod === 'yearly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Anual
          <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 font-semibold border-0">
            -15%
          </Badge>
        </button>
      </div>
    </div>
  );
}

function PricingTier({
  tier,
  isCompact = false,
  currentSubscription,
  isLoading,
  isFetchingPlan,
  selectedPlan,
  onPlanSelect,
  onSubscriptionUpdate,
  isAuthenticated = false,
  returnUrl,
  insideDialog = false,
  billingPeriod = 'monthly',
}: PricingTierProps) {
  // Auto-select the correct plan only on initial load - simplified since no more Custom tier
  const handleSubscribe = async (planStripePriceId: string) => {
    // Check if this is the Enterprise plan (no price ID)
    if (!planStripePriceId || tier.isContactSales) {
      // Open contact form or redirect to contact page
      window.location.href = 'mailto:vendas@prophet.build?subject=Interesse%20no%20Plano%20Enterprise';
      return;
    }
    
    if (!isAuthenticated) {
      window.location.href = '/auth?mode=signup';
      return;
    }

    if (isLoading[planStripePriceId]) {
      return;
    }

    try {
      onPlanSelect?.(planStripePriceId);

      const response: CreateCheckoutSessionResponse =
        await createCheckoutSession({
          price_id: planStripePriceId,
          success_url: returnUrl,
          cancel_url: returnUrl,
        });

      console.log('Subscription action response:', response);

      switch (response.status) {
        case 'new':
        case 'checkout_created':
          if (response.url) {
            window.location.href = response.url;
          } else {
            console.error(
              "Error: Received status 'checkout_created' but no checkout URL.",
            );
            toast.error('Falha ao iniciar assinatura. Por favor, tente novamente.');
          }
          break;
        case 'upgraded':
        case 'updated':
          const upgradeMessage = response.details?.is_upgrade
            ? `Assinatura atualizada de $${response.details.current_price} para $${response.details.new_price}`
            : 'Assinatura atualizada com sucesso';
          toast.success(upgradeMessage);
          if (onSubscriptionUpdate) onSubscriptionUpdate();
          break;
        case 'downgrade_scheduled':
        case 'scheduled':
          const effectiveDate = response.effective_date
            ? new Date(response.effective_date).toLocaleDateString()
            : 'the end of your billing period';

          const statusChangeMessage = 'Alteração de assinatura agendada';

          toast.success(
            <div>
              <p>{statusChangeMessage}</p>
              <p className="text-sm mt-1">
                Seu plano será alterado em {effectiveDate}.
              </p>
            </div>,
          );
          if (onSubscriptionUpdate) onSubscriptionUpdate();
          break;
        case 'no_change':
          toast.info(response.message || 'Você já está neste plano.');
          break;
        default:
          console.warn(
            'Received unexpected status from createCheckoutSession:',
            response.status,
          );
          toast.error('Ocorreu um erro inesperado. Por favor, tente novamente.');
      }
    } catch (error: any) {
      console.error('Error processing subscription:', error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        'Falha ao processar assinatura. Por favor, tente novamente.';
      toast.error(errorMessage);
    }
  };

  const tierPriceId = billingPeriod === 'yearly' && tier.yearlyStripePriceId
    ? tier.yearlyStripePriceId
    : tier.stripePriceId;
  const displayPrice = billingPeriod === 'yearly' && tier.yearlyPrice
    ? tier.yearlyPrice
    : tier.price;

  // Find the current tier (moved outside conditional for JSX access)
  const currentTier = siteConfig.cloudPricingItems.find(
    (p) => p.stripePriceId === currentSubscription?.price_id || p.yearlyStripePriceId === currentSubscription?.price_id,
  );

  // Enhanced logic to detect current plan including 100% discount cases
  const isCurrentActivePlan = (() => {
    if (!isAuthenticated || !currentSubscription) return false;
    
    // Direct price ID match
    if (currentSubscription.price_id === tierPriceId) return true;
    
    // Check for Pro plan with 100% discount
    const proPriceIds = ['price_1RqK0hFNfWjTbEjsaAFuY7Cb', 'price_1RqK0hFNfWjTbEjsN9XCGLA4'];
    if (tier.name === 'Pro' && proPriceIds.includes(currentSubscription.price_id)) return true;
    
    // Check by plan name for manual assignments
    if (tier.name === 'Free' && !currentSubscription.price_id && currentSubscription.status !== 'active') return true;
    if (tier.name === 'Pro' && currentSubscription.plan_name === 'base') return true;
    if (tier.name === 'Pro Max' && currentSubscription.plan_name === 'extra') return true;
    if (tier.name === 'Enterprise' && currentSubscription.plan_name === 'enterprise') return true;
    
    return false;
  })();
  const isScheduled = isAuthenticated && currentSubscription?.has_schedule;
  const isScheduledTargetPlan =
    isScheduled && currentSubscription?.scheduled_price_id === tierPriceId;
  const isPlanLoading = isLoading[tierPriceId];

  let buttonText = isAuthenticated ? 'Selecionar Plano' : 'Começar Grátis';
  let buttonDisabled = isPlanLoading;
  let buttonVariant: ButtonVariant = null;
  let ringClass = '';
  let statusBadge = null;
  let buttonClassName = '';

  // Special handling for Enterprise plan
  if (tier.isContactSales) {
    buttonText = 'Entre em contato';
    buttonVariant = 'default';
    buttonClassName = 'bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black';
  } else if (isAuthenticated) {
    if (isCurrentActivePlan) {
      buttonText = 'Plano Atual';
      buttonDisabled = true;
      buttonVariant = 'secondary';
      ringClass = isCompact ? 'ring-1 ring-primary' : 'ring-2 ring-primary';
      buttonClassName = 'bg-zinc-100 dark:bg-zinc-900/20 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/30';
      statusBadge = (
        <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900/20 text-zinc-700 dark:text-zinc-300">
          Atual
        </span>
      );
    } else if (isScheduledTargetPlan) {
      buttonText = 'Agendado';
      buttonDisabled = true;
      buttonVariant = 'outline';
      ringClass = isCompact
        ? 'ring-1 ring-yellow-500'
        : 'ring-2 ring-yellow-500';
      buttonClassName =
        'bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      statusBadge = (
        <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
          Agendado
        </span>
      );
    } else if (isScheduled && currentSubscription?.price_id === tierPriceId) {
      buttonText = 'Alteração Agendada';
      buttonVariant = 'secondary';
      ringClass = isCompact ? 'ring-1 ring-primary' : 'ring-2 ring-primary';
      buttonClassName = 'bg-primary/5 hover:bg-primary/10 text-primary';
      statusBadge = (
        <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
          Downgrade Pendente
        </span>
      );
    } else {
      const currentPriceString = currentSubscription
        ? currentTier?.price || '$0'
        : '$0';
      const selectedPriceString = tier.price;
      const currentAmount =
        currentPriceString === '$0'
          ? 0
          : parseFloat(currentPriceString.replace(/[^\d.]/g, '') || '0') * 100;
      const targetAmount =
        selectedPriceString === '$0'
          ? 0
          : parseFloat(selectedPriceString.replace(/[^\d.]/g, '') || '0') * 100;

      // Check if current subscription is monthly and target is yearly for same tier
      const currentIsMonthly = currentTier && currentSubscription?.price_id === currentTier.stripePriceId;
      const currentIsYearly = currentTier && currentSubscription?.price_id === currentTier.yearlyStripePriceId;
      const targetIsMonthly = tier.stripePriceId === tierPriceId;
      const targetIsYearly = tier.yearlyStripePriceId === tierPriceId;
      const isSameTierDifferentBilling = currentTier && currentTier.name === tier.name &&
        ((currentIsMonthly && targetIsYearly) || (currentIsYearly && targetIsMonthly));

      if (
        currentAmount === 0 &&
        targetAmount === 0 &&
        currentSubscription?.status !== 'no_subscription'
      ) {
        buttonText = 'Selecionar Plano';
        buttonDisabled = true;
        buttonVariant = 'secondary';
        buttonClassName = 'bg-primary/5 hover:bg-primary/10 text-primary';
      } else {
        if (targetAmount > currentAmount || (currentIsMonthly && targetIsYearly && targetAmount >= currentAmount)) {
          // Allow upgrade to higher tier OR switch from monthly to yearly at same/higher tier
          // But prevent yearly to monthly switches even if target amount is higher
          if (currentIsYearly && targetIsMonthly) {
            buttonText = '-';
            buttonDisabled = true;
            buttonVariant = 'secondary';
            buttonClassName =
              'opacity-50 cursor-not-allowed bg-muted text-muted-foreground';
          } else if (currentIsMonthly && targetIsYearly && targetAmount === currentAmount) {
            buttonText = 'Mudar para Anual';
            buttonVariant = 'default';
            buttonClassName = 'bg-green-600 hover:bg-green-700 text-white';
          } else {
            buttonText = 'Upgrade';
            buttonVariant = tier.buttonColor as ButtonVariant;
            buttonClassName = 'bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900';
          }
        } else if (targetAmount < currentAmount && !(currentIsYearly && targetIsMonthly && targetAmount === currentAmount)) {
          buttonText = '-';
          buttonDisabled = true;
          buttonVariant = 'secondary';
          buttonClassName =
            'opacity-50 cursor-not-allowed bg-muted text-muted-foreground';
        } else if (isSameTierDifferentBilling) {
          // Allow switching between monthly and yearly for same tier
          if (currentIsMonthly && targetIsYearly) {
            buttonText = 'Mudar para Anual';
            buttonVariant = 'default';
            buttonClassName = 'bg-green-600 hover:bg-green-700 text-white';
          } else if (currentIsYearly && targetIsMonthly) {
            // Prevent downgrade from yearly to monthly
            buttonText = '-';
            buttonDisabled = true;
            buttonVariant = 'secondary';
            buttonClassName =
              'opacity-50 cursor-not-allowed bg-muted text-muted-foreground';
          } else {
            buttonText = 'Selecionar Plano';
            buttonVariant = tier.buttonColor as ButtonVariant;
            buttonClassName =
              'bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black';
          }
        } else {
          buttonText = 'Selecionar Plano';
          buttonVariant = tier.buttonColor as ButtonVariant;
          buttonClassName =
            'bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black';
        }
      }
    }

    if (isPlanLoading) {
      buttonText = 'Carregando...';
      buttonClassName = 'opacity-70 cursor-not-allowed';
    }
  } else {
    // Non-authenticated state styling
    buttonVariant = tier.buttonColor as ButtonVariant;
    buttonClassName =
      tier.buttonColor === 'default'
        ? 'bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black'
        : 'bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black';
  }

  return (
    <Card
      className={cn(
        'relative border transition-all duration-300',
        'h-full flex flex-col',
        'bg-white dark:bg-zinc-950',
        tier.isPopular && !insideDialog
          ? 'border-zinc-900/20 dark:border-zinc-100/20 shadow-lg'
          : 'border-black/6 dark:border-white/8 hover:border-black/8 dark:hover:border-white/10',
        isCurrentActivePlan && 'border-zinc-900/30 dark:border-zinc-100/30'
      )}
    >
      {/* Popular badge */}
      {tier.isPopular && !insideDialog && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            Popular
          </div>
        </div>
      )}
      
      <CardContent className={cn(
        "flex flex-col flex-1 p-0"
      )}>
        {/* Header Section */}
        <div className={cn(
          "p-6 pb-4",
          tier.isPopular && !insideDialog && "pt-9"
        )}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              {tier.name}
            </h3>
            {isAuthenticated && statusBadge}
          </div>
          {/* Price */}
          <div className="mt-3">
            {billingPeriod === 'yearly' && tier.yearlyPrice && displayPrice !== 'R$ 0' ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">R$ {Math.round(parseFloat(tier.yearlyPrice.replace('R$', '').trim()) / 12)}</span>
                  {tier.discountPercentage && (
                    <span className="text-sm line-through text-muted-foreground/60">
                      R$ {Math.round(parseFloat(tier.originalYearlyPrice?.replace('R$', '').trim() || '0') / 12)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">/mês • cobrado anualmente</p>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{displayPrice}</span>
                {displayPrice !== 'R$ 0' && !tier.isContactSales && (
                  <span className="text-sm text-muted-foreground">/mês</span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {tier.description && (
            <p className="text-sm text-muted-foreground mt-3">{tier.description}</p>
          )}

          {/* Savings Badge */}
          {billingPeriod === 'yearly' && tier.yearlyPrice && tier.discountPercentage && (
            <div className="mt-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/20 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                Economize R$ {Math.round(parseFloat(tier.originalYearlyPrice?.replace('R$', '').trim() || '0') - parseFloat(tier.yearlyPrice.replace('R$', '').trim()))}/ano
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-4">
            <Button
              onClick={() => handleSubscribe(tierPriceId)}
              disabled={buttonDisabled}
              variant={buttonVariant || 'default'}
              className={cn(
                'w-full h-10 font-medium rounded-lg transition-all duration-200',
                buttonClassName,
                isPlanLoading && 'animate-pulse cursor-wait',
                !buttonDisabled && !isCurrentActivePlan && !tier.isContactSales && 'hover:shadow-md',
                tier.isContactSales && 'bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200'
              )}
            >
              {buttonText}
            </Button>
          </div>
        </div>
        
        {/* Divider */}
        <div className="mx-6 h-px bg-black/6 dark:bg-white/8" />
        
        {/* Features Section */}
        <div className="flex-grow px-6 py-4">
          {tier.features && tier.features.length > 0 && (
            <ul className="space-y-3">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-zinc-900/10 dark:bg-zinc-100/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-2.5 h-2.5 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PricingSectionProps {
  returnUrl?: string;
  showTitleAndTabs?: boolean;
  hideFree?: boolean;
  insideDialog?: boolean;
}

export function PricingSection({
  returnUrl = typeof window !== 'undefined' ? window.location.href : '/',
  showTitleAndTabs = true,
  hideFree = false,
  insideDialog = false
}: PricingSectionProps) {
  const [deploymentType, setDeploymentType] = useState<'cloud' | 'self-hosted'>(
    'cloud',
  );
  const { data: subscriptionData, isLoading: isFetchingPlan, error: subscriptionQueryError, refetch: refetchSubscription } = useSubscription();

  // Derive authentication and subscription status from the hook data
  const isAuthenticated = !!subscriptionData && subscriptionQueryError === null;
  const currentSubscription = subscriptionData || null;

  // Determine default billing period based on user's current subscription
  const getDefaultBillingPeriod = (): 'monthly' | 'yearly' => {
    if (!isAuthenticated || !currentSubscription) {
      // Default to yearly for non-authenticated users or users without subscription
      return 'yearly';
    }

    // Find current tier to determine if user is on monthly or yearly plan
    const currentTier = siteConfig.cloudPricingItems.find(
      (p) => p.stripePriceId === currentSubscription.price_id || p.yearlyStripePriceId === currentSubscription.price_id,
    );

    if (currentTier) {
      // Check if current subscription is yearly
      if (currentTier.yearlyStripePriceId === currentSubscription.price_id) {
        return 'yearly';
      } else if (currentTier.stripePriceId === currentSubscription.price_id) {
        return 'monthly';
      }
    }

    // Default to yearly if we can't determine current plan type
    return 'yearly';
  };

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(getDefaultBillingPeriod());
  const [planLoadingStates, setPlanLoadingStates] = useState<Record<string, boolean>>({});

  // Update billing period when subscription data changes
  useEffect(() => {
    setBillingPeriod(getDefaultBillingPeriod());
  }, [isAuthenticated, currentSubscription?.price_id]);

  const handlePlanSelect = (planId: string) => {
    setPlanLoadingStates((prev) => ({ ...prev, [planId]: true }));
  };

  const handleSubscriptionUpdate = () => {
    refetchSubscription();
    // The useSubscription hook will automatically refetch, so we just need to clear loading states
    setTimeout(() => {
      setPlanLoadingStates({});
    }, 1000);
  };

  const handleTabChange = (tab: 'cloud' | 'self-hosted') => {
    if (tab === 'self-hosted') {
      const openSourceSection = document.getElementById('open-source');
      if (openSourceSection) {
        const rect = openSourceSection.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const offsetPosition = scrollTop + rect.top - 100;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    } else {
      setDeploymentType(tab);
    }
  };

  if (isLocalMode()) {
    return (
      <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          Executando em modo de desenvolvimento local - recursos de cobrança estão desabilitados
        </p>
      </div>
    );
  }

  return (
    <section
      id="pricing"
      className={cn("py-32 relative overflow-hidden", insideDialog && "py-0")}
    >
      {/* Background gradient */}
      {!insideDialog && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </>
      )}
      
      <div className="relative">
        {showTitleAndTabs && (
          <>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                PLANOS & PREÇOS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Escolha o plano ideal para você
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Comece com nosso plano gratuito ou faça upgrade para mais créditos de IA
              </p>
            </div>
            <div className="relative w-full h-full mb-8">
              <div className="flex justify-center">
                <PricingTabs
                  activeTab={deploymentType}
                  setActiveTab={handleTabChange}
                  className="mx-auto"
                />
              </div>
            </div>
          </>
        )}

        {deploymentType === 'cloud' && (
          <>
            <div className="flex justify-center mb-12">
              <BillingPeriodToggle
                billingPeriod={billingPeriod}
                setBillingPeriod={setBillingPeriod}
              />
            </div>

            <div className={cn(
              "grid gap-4 mx-auto pt-4",
              {
                "px-6 max-w-7xl": !insideDialog,
                "max-w-full": insideDialog
              },
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
              "items-stretch"
            )}>
              {siteConfig.cloudPricingItems
                .filter((tier) => !tier.hidden && (!hideFree || tier.price !== '$0'))
                .map((tier) => (
                  <PricingTier
                    key={tier.name}
                    tier={tier}
                    currentSubscription={currentSubscription}
                    isLoading={planLoadingStates}
                    isFetchingPlan={isFetchingPlan}
                    onPlanSelect={handlePlanSelect}
                    onSubscriptionUpdate={handleSubscriptionUpdate}
                    isAuthenticated={isAuthenticated}
                    returnUrl={returnUrl}
                    insideDialog={insideDialog}
                    billingPeriod={billingPeriod}
                  />
                ))}
            </div>
            
            {/* Trust indicators */}
            {!insideDialog && (
              <div className="mt-20 text-center">
                <div className="inline-flex flex-col items-center gap-6">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">Pagamento seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">Ativação instantânea</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">Cancele quando quiser</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dúvidas? Entre em contato com nossa equipe de vendas
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
