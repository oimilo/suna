'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, AlertCircle, Zap } from 'lucide-react';
import { backendApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface CreditPurchaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: number;
  canPurchase: boolean;
}

interface CreditPackage {
  amount: number;
  price: number;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { amount: 10, price: 10 },
  { amount: 25, price: 25 },
  { amount: 50, price: 50 },
  { amount: 100, price: 100, popular: true },
  { amount: 250, price: 250 },
  { amount: 500, price: 500 },
];

export function CreditPurchaseModal({
  open,
  onOpenChange,
  currentBalance = 0,
  canPurchase,
}: CreditPurchaseProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (amount: number) => {
    if (amount < 1) {
      setError('Valor mínimo de compra é US$ 1.');
      return;
    }
    if (amount > 5000) {
      setError('Valor máximo de compra é US$ 5000.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await backendApi.post('/billing/purchase-credits', {
        amount,
        success_url: `${window.location.origin}/dashboard?credit_purchase=success`,
        cancel_url: `${window.location.origin}/dashboard?credit_purchase=cancelled`,
      });

      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('Checkout não retornou URL de redirecionamento.');
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || 'Não foi possível criar o checkout.';
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPackage(null);
    setError(null);
  };

  const handleConfirmPurchase = () => {
    const amount = selectedPackage ? selectedPackage.amount : parseFloat(customAmount);
    if (!Number.isNaN(amount)) {
      handlePurchase(amount);
    } else {
      setError('Selecione um pacote ou informe um valor válido.');
    }
  };

  if (!canPurchase) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compra de créditos indisponível</DialogTitle>
            <DialogDescription>
              Essa conta não possui permissão para comprar créditos adicionais.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Atualize para um plano superior para habilitar a compra de créditos sob demanda.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Comprar créditos adicionais
          </DialogTitle>
          <DialogDescription>
            Adicione créditos à sua conta para continuar usando o Prophet além do limite do plano.
          </DialogDescription>
        </DialogHeader>

        {currentBalance > 0 && (
          <Alert className="mb-4 border-primary/30 bg-primary/5 text-primary">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Saldo atual: <strong>${currentBalance.toFixed(2)}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Selecionar pacote
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.amount}
                  className={`cursor-pointer transition-all ${
                    selectedPackage?.amount === pkg.amount ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  <CardContent className="p-4 text-center relative space-y-1">
                    {pkg.popular && (
                      <Badge className="absolute -top-2 -right-2" variant="default">
                        Popular
                      </Badge>
                    )}
                    <div className="text-2xl font-bold">${pkg.amount}</div>
                    <div className="text-xs text-muted-foreground">créditos</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">Ou informe um valor personalizado</Label>
            <Input
              id="custom-amount"
              type="number"
              min="1"
              placeholder="Ex.: 75"
              value={customAmount}
              onChange={(event) => handleCustomAmountChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">US$ 1 = 1 crédito.</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPurchase} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Confirmar compra
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

