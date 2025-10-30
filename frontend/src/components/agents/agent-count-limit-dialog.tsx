'use client';

import React from 'react';
import Link from 'next/link';
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
import { AlertTriangle } from 'lucide-react';

interface AgentCountLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  limit: number;
  tierName?: string;
}

export const AgentCountLimitDialog: React.FC<AgentCountLimitDialogProps> = ({
  open,
  onOpenChange,
  currentCount,
  limit,
  tierName,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Limite de agentes atingido
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
            <p>
              Você já possui <strong>{currentCount}</strong> agente
              {currentCount !== 1 ? 's' : ''} configurado
              {currentCount !== 1 ? 's' : ''} e o limite do seu plano atual é de
              {' '}<strong>{limit}</strong>.
            </p>
            <p>
              {tierName
                ? 'Considere atualizar o plano ou liberar espaço removendo algum agente que não esteja em uso.'
                : 'Para continuar criando novos agentes, faça upgrade de plano ou remova um agente existente.'}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>Fechar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href="/settings/billing">Ir para billing</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

