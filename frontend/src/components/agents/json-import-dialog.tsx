'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileJson } from 'lucide-react';

interface JsonImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (agentId: string) => void;
  initialJsonText?: string;
}

export const JsonImportDialog: React.FC<JsonImportDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Importar agente via JSON
          </DialogTitle>
          <DialogDescription>
            Estamos finalizando a porta do fluxo completo de importação do Prophet.
            Em breve você poderá colar o JSON exportado e restaurar o agente automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Enquanto isso, crie o agente manualmente e replique prompts/configurações principais.
          Assim que os endpoints de importação estiverem disponíveis, atualizaremos este modal.
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

