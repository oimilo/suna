'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import NewTeamForm from '@/components/basejump/new-team-form';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function CreateTeamDialog({
  open,
  onOpenChange,
}: CreateTeamDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-subtle dark:border-white/10 bg-white dark:bg-gray-900 rounded-2xl shadow-custom">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Criar nova equipe
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Crie uma equipe para colaborar com outras pessoas.
          </DialogDescription>
        </DialogHeader>
        <NewTeamForm />
      </DialogContent>
    </Dialog>
  );
}
