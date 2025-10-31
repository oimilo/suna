'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { PricingSection } from '@/components/home/sections/pricing-section';
import { useAuth } from '@/components/AuthProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isLocalMode } from '@/lib/config';
import {
  getSubscription,
  createPortalSession,
  SubscriptionStatus,
} from '@/lib/api';
import { CreditPurchaseModal } from '@/components/billing/credit-purchase';
import { CreditBalanceCard } from '@/components/billing/credit-balance-card';
import { useSubscriptionCommitment } from '@/hooks/react-query/subscriptions/use-subscriptions';

interface BillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnUrl?: string;
  showUsageLimitAlert?: boolean;
}

export function BillingModal({
  open,
  onOpenChange,
  returnUrl = typeof window !== 'undefined' ? window.location.href : '/',
  showUsageLimitAlert = false,
}: BillingModalProps) {
  const { session, isLoading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const { data: commitmentInfo } = useSubscriptionCommitment(subscriptionData?.subscription?.id || undefined);

  const fetchSubscription = useCallback(async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      const data = await getSubscription();
      setSubscriptionData(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados de assinatura');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (open && !authLoading) {
      void fetchSubscription();
    }
  }, [open, authLoading, fetchSubscription]);

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      const { url } = await createPortalSession({ return_url: returnUrl });
      window.location.href = url;
    } catch (err) {
      console.error('Falha ao abrir o portal de cobrança:', err);
      toast.error('Não foi possível abrir o portal de cobrança.');
    } finally {
      setIsManaging(false);
    }
  };

  if (isLocalMode()) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Billing desabilitado no modo local</DialogTitle>
            <DialogDescription>
              Em desenvolvimento local o Prophet permite uso ilimitado sem cobrança.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Gerenciar assinatura
          </DialogTitle>
          <DialogDescription>
            Escolha um plano, visualize limites e créditos adicionais disponíveis.
          </DialogDescription>
        </DialogHeader>

        {isLoading || authLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <CreditBalanceCard
              showPurchaseButton={subscriptionData?.credits?.can_purchase_credits ?? false}
              tierCredits={subscriptionData?.credits?.tier_credits}
            />

            {showUsageLimitAlert && (
              <Alert>
                <AlertDescription>
                  Você está próximo do limite mensal do plano. Considere atualizar ou adquirir créditos extras.
                </AlertDescription>
              </Alert>
            )}

            <PricingSection
              returnUrl={returnUrl}
              showTitleAndTabs={false}
              insideDialog
            />

            <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setShowCreditModal(true)}
                >
                  Comprar créditos avulsos
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleManageSubscription}
                  disabled={isManaging}
                >
                  {isManaging ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Abrindo portal...
                    </>
                  ) : (
                    'Gerenciar cobrança no Stripe'
                  )}
                </Button>
              </div>
              {commitmentInfo?.has_commitment && commitmentInfo.commitment_end_date && (
                <span className="text-xs text-muted-foreground text-center sm:text-right w-full sm:w-auto">
                  Compromisso anual ativo até {new Date(commitmentInfo.commitment_end_date).toLocaleDateString('pt-BR')}.
                </span>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>

      <CreditPurchaseModal
        open={showCreditModal}
        onOpenChange={setShowCreditModal}
        currentBalance={subscriptionData?.credits?.balance}
        canPurchase={subscriptionData?.credits?.can_purchase_credits ?? false}
      />
    </Dialog>
  );
}