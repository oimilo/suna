import { useState, useCallback } from 'react';
import { ProjectLimitError, BillingError } from '@/lib/api/errors';
import { usePricingModalStore } from '@/stores/pricing-modal-store';

interface UseBillingModalReturn {
  showModal: boolean;
  creditsExhausted: boolean;
  openModal: (error?: BillingError | ProjectLimitError) => void;
  closeModal: () => void;
}

/**
 * Unified hook for handling billing modals consistently across the app.
 * Determines if credits are exhausted based on the error type and message.
 */
export function useBillingModal(): UseBillingModalReturn {
  const { isOpen, closePricingModal, openPricingModal } = usePricingModalStore();
  const [creditsExhausted, setCreditsExhausted] = useState(false);

  const openModal = useCallback((error?: BillingError | ProjectLimitError) => {
    let isCreditsExhausted = false;

    if (error instanceof BillingError) {
      const message = error.detail?.message?.toLowerCase() || '';
      isCreditsExhausted =
        message.includes('credit') ||
        message.includes('balance') ||
        message.includes('insufficient') ||
        message.includes('out of credits') ||
        message.includes('no credits');
    } else {
      isCreditsExhausted = false;
    }

    setCreditsExhausted(isCreditsExhausted);
    openPricingModal({
      isAlert: isCreditsExhausted,
      alertTitle: isCreditsExhausted ? 'You ran out of credits. Upgrade now.' : undefined,
      title: !isCreditsExhausted ? 'Pick the plan that works for you.' : undefined,
      returnUrl: typeof window !== 'undefined' ? window.location.href : '/',
    });
  }, [openPricingModal]);

  const closeModal = useCallback(() => {
    setCreditsExhausted(false);
    closePricingModal();
  }, [closePricingModal]);

  return {
    showModal: isOpen,
    creditsExhausted,
    openModal,
    closeModal,
  };
}
