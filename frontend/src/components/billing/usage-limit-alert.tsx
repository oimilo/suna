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
                Créditos do plano utilizados
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
            <p className="text-sm text-muted-foreground mb-2">{message}</p>
            
            <div className="flex items-center gap-1 mb-3 text-xs text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" />
              <span>Você ainda tem créditos diários gratuitos!</span>
            </div>

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
