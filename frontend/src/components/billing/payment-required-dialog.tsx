import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useModal } from '@/hooks/use-modal-store';
import { PricingSection } from '../home/sections/pricing-section';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export const PaymentRequiredDialog = () => {
    const { isOpen, type, onClose } = useModal();
    const isModalOpen = isOpen && type === 'paymentRequiredDialog';
    
    return (
      <Dialog open={isModalOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-black/6 dark:border-white/8">
              <DialogTitle className="text-lg font-semibold">
                Escolha seu plano
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Selecione o plano ideal para suas necessidades e continue utilizando o Prophet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
              <div className="w-full">
                <PricingSection 
                  insideDialog={true} 
                  hideFree={true} 
                  returnUrl={`${returnUrl}/dashboard`} 
                  showTitleAndTabs={false} 
                />
              </div>
            </div>
        </DialogContent>
      </Dialog>
    );
};