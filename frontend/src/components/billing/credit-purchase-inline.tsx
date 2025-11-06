'use client';

import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditPurchaseInlineProps {
  className?: string;
  showPurchaseButton?: boolean;
  disablePurchase?: boolean;
  isLoading?: boolean;
  tierCredits?: number | string | null;
  currentBalance?: number;
  canPurchase?: boolean;
  onOpenCheckout?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  billingUrl?: string;
  [key: string]: unknown;
}

/**
 * Lightweight wrapper retained for historical compatibility with the Prophet UI.
 * The upstream Suna frontend no longer exposes an inline credit purchase button,
 * so we render a simple action that triggers the provided callbacks.
 */
export function CreditPurchaseInline({
  className,
  showPurchaseButton = true,
  disablePurchase,
  isLoading,
  tierCredits,
  onOpenCheckout,
  onSuccess,
  onError,
}: CreditPurchaseInlineProps) {
  if (!showPurchaseButton) {
    return null;
  }

  const handleClick = async () => {
    try {
      if (onOpenCheckout) {
        onOpenCheckout();
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        type="button"
        onClick={handleClick}
        disabled={disablePurchase || isLoading}
        className="w-full justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Comprar créditos
          </>
        )}
      </Button>
      {tierCredits !== undefined && tierCredits !== null && (
        <span className="text-xs text-muted-foreground">
          Limite mensal: {tierCredits}
        </span>
      )}
    </div>
  );
}
