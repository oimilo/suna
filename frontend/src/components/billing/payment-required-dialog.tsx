import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useModal } from '@/hooks/use-modal-store';
import { PricingSection } from '../home/sections/pricing-section';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export const PaymentRequiredDialog = () => {
    const { isOpen, type, onClose } = useModal();
    const isModalOpen = isOpen && type === 'paymentRequiredDialog';
    
    return (
      <Dialog open={isModalOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
              <DialogTitle>
                Hora de expandir seus limites!
              </DialogTitle>
              <DialogDescription>
                Você alcançou o limite do seu plano atual. Continue crescendo com mais créditos e recursos avançados.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 pb-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent px-4 sm:px-6 min-h-0">
              <div className="space-y-4 sm:space-y-6 pb-4">
                <div className="flex items-start p-3 sm:p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-xs sm:text-sm min-w-0">
                      <p className="font-medium text-foreground">Você está no limite!</p>
                      <p className="text-muted-foreground break-words">
                        Seus créditos do plano acabaram, mas você ainda tem <span className="font-medium text-amber-600 dark:text-amber-400">créditos diários gratuitos</span> disponíveis.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <PricingSection 
                    insideDialog={true} 
                    hideFree={true} 
                    returnUrl={`${returnUrl}/dashboard`} 
                    showTitleAndTabs={false} 
                  />
                </div>
              </div>
            </div>
        </DialogContent>
      </Dialog>
    );
};