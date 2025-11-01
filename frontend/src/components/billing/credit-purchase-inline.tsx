'use client';

import { useState } from 'react';
import { AlertCircle, CreditCard, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { backendApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CREDIT_PACKAGES = [10, 25, 50, 100, 250, 500];

interface CreditPurchaseInlineProps {
  currentBalance?: number;
  canPurchase: boolean;
  className?: string;
}

export function CreditPurchaseInline({
  currentBalance = 0,
  canPurchase,
  className,
}: CreditPurchaseInlineProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  const handleSelectPackage = (value: number) => {
    setSelectedPackage(value);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPackage(null);
    setError(null);
  };

  const handlePurchase = async (amount: number) => {
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    if (amount > 5000) {
      setError('Valor máximo permitido é US$ 5000.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await backendApi.post('/billing/purchase-credits', {
        amount,
        success_url: `${window.location.origin}/settings/billing?credit_purchase=success`,
        cancel_url: `${window.location.origin}/settings/billing?credit_purchase=cancelled`,
      });

      const checkoutUrl = response.data?.url || response.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Checkout não retornou uma URL para redirecionamento.');
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || 'Não foi possível iniciar a compra de créditos.';
      toast.error(message);
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPurchase = () => {
    const value = selectedPackage ?? parseFloat(customAmount);
    handlePurchase(value);
  };

  if (!canPurchase) {
    return (
      <div className={cn('space-y-4', className)}>
        <Alert className="border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta conta não possui permissão para adquirir créditos adicionais. Entre em contato com o suporte para
            habilitar essa opção ou migre para um plano superior.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Saldo disponível</p>
          <p className="text-2xl font-semibold tracking-tight">{formatCurrency(currentBalance)}</p>
        </div>
        <Badge className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 px-3 py-1">
          <ShoppingCart className="h-3.5 w-3.5" />
          Créditos sob demanda
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {CREDIT_PACKAGES.map((amount) => (
          <Card
            key={amount}
            className={cn(
              'cursor-pointer border border-border/60 bg-background/80 transition-all',
              selectedPackage === amount
                ? 'ring-2 ring-primary shadow-md'
                : 'hover:border-primary/40 hover:shadow-sm',
            )}
            onClick={() => handleSelectPackage(amount)}
          >
            <CardContent className="flex h-full flex-col items-center justify-center gap-1 py-6 text-center">
              <span className="text-xl font-semibold">{formatCurrency(amount)}</span>
              <span className="text-xs text-muted-foreground">equivale a {amount} créditos</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-credit-amount">Ou defina um valor personalizado</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="custom-credit-amount"
            type="number"
            min={1}
            step="0.01"
            placeholder="Ex.: 75"
            value={customAmount}
            onChange={(event) => handleCustomAmountChange(event.target.value)}
            className="sm:max-w-xs"
          />
          <Button
            onClick={handleConfirmPurchase}
            disabled={isProcessing}
            className="sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Comprar créditos
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Cada crédito equivale a US$ 1. Valores acima de US$ 5000 devem ser negociados com o time comercial.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}


