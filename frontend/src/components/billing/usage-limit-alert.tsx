'use client';

import { Info, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BillingErrorAlertProps {
  message?: string;
  currentUsage?: number;
  limit?: number;
  accountId?: string | null;
  onDismiss: () => void;
  isOpen: boolean;
}

export function BillingErrorAlert({
  message,
  currentUsage,
  limit,
  accountId,
  onDismiss,
  isOpen,
}: BillingErrorAlertProps) {
  const router = useRouter();

  if (!isOpen) return null;

  // Determinar o tipo de erro baseado na mensagem
  const isDailyCreditsExhausted = message?.includes('Créditos diários esgotados');
  const isMonthlyLimitReached = message?.includes('Limite mensal');
  const isBothExhausted = message?.includes('e créditos diários esgotados');

  // Definir título e descrição baseado no tipo de erro
  const getTitle = () => {
    if (isBothExhausted) return 'Todos os créditos esgotados';
    if (isDailyCreditsExhausted) return 'Créditos diários esgotados';
    if (isMonthlyLimitReached) return 'Limite do plano atingido';
    return 'Créditos esgotados';
  };

  const getDescription = () => {
    if (isBothExhausted) {
      return 'Seus créditos do plano e diários foram totalmente utilizados.';
    }
    if (isDailyCreditsExhausted) {
      return 'Seus 200 créditos diários gratuitos foram utilizados. Novos créditos em breve!';
    }
    if (isMonthlyLimitReached) {
      return 'Você atingiu o limite mensal do seu plano.';
    }
    return 'Você atingiu o limite de créditos.';
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 rounded-lg p-5 shadow-lg max-w-md">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-amber-500/20 p-2 rounded-full">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-foreground">
                {getTitle()}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {getDescription()}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDismiss}
                className="text-xs"
              >
                Entendi
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  router.push(`/settings/billing?accountId=${accountId}`)
                }
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Ver Opções de Upgrade
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
