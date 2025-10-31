'use client';

import { useState } from 'react';
import {
  ShoppingCart,
  Clock,
  Infinity,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCreditBalance,
  usePurchaseCredits,
} from '@/hooks/react-query/use-billing-v2';

interface CreditBalanceCardProps {
  showPurchaseButton?: boolean;
  compact?: boolean;
  tierCredits?: number;
}

export function CreditBalanceCard({
  showPurchaseButton = true,
  compact = false,
  tierCredits,
}: CreditBalanceCardProps) {
  const { user } = useAuth();
  const { data: balance, isLoading, error } = useCreditBalance(!!user);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState('10');

  const purchaseMutation = usePurchaseCredits();

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Não foi possível carregar o saldo de créditos.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-2 w-full mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (!balance) return null;

  const expiringCredits = balance.expiring_credits ?? balance.balance;
  const nonExpiringCredits = balance.non_expiring_credits ?? 0;
  const hasBreakdown =
    balance.expiring_credits !== undefined && balance.non_expiring_credits !== undefined;

  const maxCredits = tierCredits || balance.balance;
  const availablePercentage = maxCredits > 0 ? (balance.balance / maxCredits) * 100 : 100;

  const handlePurchase = async () => {
    const amount = parseFloat(purchaseAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Informe um valor válido para comprar créditos.');
      return;
    }

    const returnUrl = typeof window !== 'undefined' ? window.location.href : '/';

    purchaseMutation.mutate(
      {
        amount,
        success_url: `${returnUrl}?purchase=success`,
        cancel_url: `${returnUrl}?purchase=cancelled`,
      },
      {
        onSuccess: () => {
          setShowPurchaseModal(false);
          toast.success('Redirecionando para o checkout...');
        },
        onError: (err) => {
          toast.error(`Não foi possível criar o checkout: ${err.message}`);
        },
      },
    );
  };

  const formatNextGrant = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Créditos disponíveis</p>
            <p className="text-2xl font-bold">${balance.balance.toFixed(2)}</p>
            {hasBreakdown && showPurchaseButton && balance.can_purchase_credits && (
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1 text-orange-500" />
                  ${expiringCredits.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground">
                  <Infinity className="h-3 w-3 inline mr-1 text-emerald-500" />
                  ${nonExpiringCredits.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
        {showPurchaseButton && balance.can_purchase_credits && (
          <Button onClick={() => setShowPurchaseModal(true)} size="sm" variant="outline">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Comprar créditos
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-none bg-transparent p-0 mt-2">
        <CardContent className="space-y-4 p-0">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${balance.balance.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">disponíveis</span>
              </div>
              <Badge variant="outline" className="px-2 py-1 text-[11px]">
                {availablePercentage.toFixed(0)}% do limite mensal
              </Badge>
            </div>

            {hasBreakdown && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border bg-orange-50/60 dark:bg-orange-950/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div className="text-xs">
                      <p className="font-medium">Créditos que expiram</p>
                      <p className="text-muted-foreground">
                        Renovam com o ciclo do plano
                        {formatNextGrant(balance.next_credit_grant) && (
                          <>
                            <br />
                            Próximo grant: {formatNextGrant(balance.next_credit_grant)}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    ${expiringCredits.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Infinity className="h-4 w-4 text-sky-600" />
                    <div className="text-xs">
                      <p className="font-medium">Créditos sem expiração</p>
                      <p className="text-muted-foreground">Utilizados após esgotar o plano</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-sky-600">
                    ${nonExpiringCredits.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {showPurchaseButton && balance.can_purchase_credits && (
            <div className="pt-2 pb-4">
              <Button onClick={() => setShowPurchaseModal(true)} className="w-full" variant="outline">
                <ShoppingCart className="h-4 w-4" />
                Comprar créditos adicionais
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprar créditos</DialogTitle>
            <DialogDescription>
              <Alert className="mt-2 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
                <Infinity className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                  Créditos adquiridos não expiram e só são usados quando o plano mensal termina.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Valor em USD</Label>
              <Input
                id="credit-amount"
                type="number"
                min="1"
                step="1"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="Ex.: 25"
              />
              <p className="text-sm text-muted-foreground">US$ 1 = 1 crédito. Compra mínima: US$ 1.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50, 100, 200, 500].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  className="flex-1 h-20 text-2xl font-bold"
                  onClick={() => setPurchaseAmount(String(preset))}
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowPurchaseModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePurchase} disabled={purchaseMutation.isPending}>
              {purchaseMutation.isPending ? 'Processando...' : `Comprar $${purchaseAmount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

