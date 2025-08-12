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
      className={isCompact ? 'text-xl font-semibold' : 'text-4xl font-semibold'}
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
    <div className="flex items-center justify-center gap-3">
      <div
        className="relative bg-muted rounded-full p-1.5 cursor-pointer shadow-inner"
        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
      >
        <div className="flex relative">
          {/* Sliding background */}
          <motion.div
            className="absolute inset-y-0 bg-primary rounded-full shadow-md"
            initial={false}
            animate={{
              x: billingPeriod === 'monthly' ? 0 : '100%',
              width: billingPeriod === 'monthly' ? '64px' : '120px',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          
          <div className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative z-10",
            billingPeriod === 'monthly'
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}>
            Mensal
          </div>
          <div className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 relative z-10",
            billingPeriod === 'yearly'
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}>
            Anual
            <Badge className="bg-green-600 text-green-50 dark:bg-green-500 dark:text-green-50 text-[10px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap border-0 shadow-sm">
              -15%
            </Badge>
          </div>
        </div>
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
    buttonClassName = 'bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black';
  } else if (isAuthenticated) {
    if (isCurrentActivePlan) {
      buttonText = 'Plano Atual';
      buttonDisabled = true;
      buttonVariant = 'secondary';
      ringClass = isCompact ? 'ring-1 ring-primary' : 'ring-2 ring-primary';
      buttonClassName = 'bg-primary/5 hover:bg-primary/10 text-primary';
      statusBadge = (
        <span className="bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded-full">
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
        <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          Agendado
        </span>
      );
    } else if (isScheduled && currentSubscription?.price_id === tierPriceId) {
      buttonText = 'Alteração Agendada';
      buttonVariant = 'secondary';
      ringClass = isCompact ? 'ring-1 ring-primary' : 'ring-2 ring-primary';
      buttonClassName = 'bg-primary/5 hover:bg-primary/10 text-primary';
      statusBadge = (
        <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
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
            buttonClassName = 'bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black';
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
        'relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl',
        insideDialog
          ? 'min-h-[300px]'
          : 'h-full min-h-[300px]',
        tier.isPopular && !insideDialog
          ? 'border-primary/30 shadow-xl scale-105'
          : 'hover:border-primary/20',
        !insideDialog && ringClass,
        isCurrentActivePlan && 'border-primary/50'
      )}
    >
      {/* Popular badge */}
      {tier.isPopular && !insideDialog && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            MAIS POPULAR
          </div>
        </div>
      )}
      
      {/* Background gradient */}
      {tier.isPopular && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0" />
      )}
      <CardContent className={cn(
        "flex flex-col h-full",
        insideDialog ? "p-6" : "p-8",
        tier.isPopular && "pt-12"
      )}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              {tier.name}
            </h3>
            {/* Show upgrade badge for yearly plans when user is on monthly */}
            {!tier.isPopular && isAuthenticated && currentSubscription && billingPeriod === 'yearly' &&
              currentTier && currentSubscription.price_id === currentTier.stripePriceId &&
              tier.yearlyStripePriceId && (currentTier.name === tier.name ||
                parseFloat(tier.price.replace('R$', '').trim()) >= parseFloat(currentTier.price.replace('R$', '').trim())) && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Recomendado
                </Badge>
              )}
            {isAuthenticated && statusBadge}
          </div>
        <div className="flex items-baseline mt-2">
          {billingPeriod === 'yearly' && tier.yearlyPrice && displayPrice !== '$0' ? (
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <PriceDisplay price={`R$ ${Math.round(parseFloat(tier.yearlyPrice.replace('R$', '').trim()) / 12)}`} isCompact={insideDialog} />
                {tier.discountPercentage && (
                  <span className="text-xs line-through text-muted-foreground">
                    R$ {Math.round(parseFloat(tier.originalYearlyPrice?.replace('R$', '').trim() || '0') / 12)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">/mês</span>
                <span className="text-xs text-muted-foreground">cobrado anualmente</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline">
              <PriceDisplay price={displayPrice} isCompact={insideDialog} />
              <span className="ml-2">{displayPrice !== '$0' && !tier.isContactSales ? '/mês' : ''}</span>
            </div>
          )}
        </div>
          {tier.description && (
            <p className="text-sm text-muted-foreground">{tier.description}</p>
          )}

          {billingPeriod === 'yearly' && tier.yearlyPrice && tier.discountPercentage ? (
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 w-fit border border-green-500/20">
              <Shield className="w-3.5 h-3.5" />
              Economize R$ {Math.round(parseFloat(tier.originalYearlyPrice?.replace('R$', '').trim() || '0') - parseFloat(tier.yearlyPrice.replace('R$', '').trim()))} por ano
            </div>
          ) : (
            <div className="hidden items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 border-primary/20 text-primary w-fit">
              {billingPeriod === 'yearly' && tier.yearlyPrice && displayPrice !== '$0'
                ? `R$ ${Math.round(parseFloat(tier.yearlyPrice.replace('R$', '').trim()) / 12)}/mês (cobrado anualmente)`
                : `${displayPrice}/mês`
              }
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        {/* Features */}
        <div className="flex-grow">
          {tier.features && tier.features.length > 0 && (
            <ul className="space-y-3">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <div className="size-5 min-w-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform">
                    <CheckIcon className="size-3 text-primary" />
                  </div>
                  <span className="text-sm leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8">
          <Button
            onClick={() => handleSubscribe(tierPriceId)}
            disabled={buttonDisabled}
            variant={buttonVariant || 'default'}
            className={cn(
              'w-full font-medium transition-all duration-200 shadow-sm',
              isCompact || insideDialog ? 'h-10 rounded-lg text-sm' : 'h-12 rounded-xl text-base',
              buttonClassName,
              isPlanLoading && 'animate-pulse',
              !buttonDisabled && !isCurrentActivePlan && 'hover:shadow-lg hover:scale-[1.02]'
            )}
          >
            {buttonText}
          </Button>
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
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Escolha o plano ideal para suas necessidades
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
              "grid gap-8 mx-auto",
              {
                "px-6 max-w-7xl": !insideDialog,
                "max-w-7xl": insideDialog
              },
              insideDialog
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4"
                : "min-[650px]:grid-cols-2 lg:grid-cols-4",
              !insideDialog && "grid-rows-1 items-stretch"
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
