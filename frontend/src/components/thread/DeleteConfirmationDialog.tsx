'use client';

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { usePtTranslations } from '@/hooks/use-pt-translations';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  threadName: string;
  isDeleting: boolean;
}

/**
 * Confirmation dialog for deleting a conversation
 */
export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  threadName,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  const { t } = usePtTranslations();
  
  // Reset pointer events when dialog opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.pointerEvents = 'auto';
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('thread.deleteConfirmation.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('thread.deleteConfirmation.description')}{' '}
            <span className="font-semibold">"{threadName}"</span>?
            <br />
            {t('thread.deleteConfirmation.warning')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('thread.deleteConfirmation.deleting')}
              </>
            ) : (
              t('common.delete')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
