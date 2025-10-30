'use client';

import React from 'react';
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
import { Loader2, Plus } from 'lucide-react';
import { useCreateNewAgent } from '@/hooks/react-query/agents/use-agents';
import { toast } from 'sonner';
import { AgentCountLimitDialog } from './agent-count-limit-dialog';

interface NewAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (agentId: string) => void;
}

export const NewAgentDialog: React.FC<NewAgentDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const createNewAgent = useCreateNewAgent();
  const [showLimitDialog, setShowLimitDialog] = React.useState(false);
  const [limitInfo, setLimitInfo] = React.useState<{ currentCount: number; limit: number; tierName?: string } | null>(null);

  const handleCreate = async () => {
    try {
      const agent = await createNewAgent.mutateAsync();
      if (agent?.agent_id) {
        onSuccess?.(agent.agent_id);
      }
      toast.success('Agente criado com sucesso');
      onOpenChange(false);
    } catch (error: any) {
      // Enquanto não temos o erro tipado do backend, tratamos genericamente
      if (error?.detail?.limit) {
        setLimitInfo({
          currentCount: error.detail.current_count ?? 0,
          limit: error.detail.limit,
          tierName: error.detail.tier_name,
        });
        setShowLimitDialog(true);
      } else {
        toast.error(error?.message ?? 'Não foi possível criar o agente');
      }
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      createNewAgent.reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar novo agente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Geraremos um agente com as configurações padrão para que você personalize em seguida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate} disabled={createNewAgent.isPending}>
              {createNewAgent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar agente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {limitInfo && (
        <AgentCountLimitDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          currentCount={limitInfo.currentCount}
          limit={limitInfo.limit}
          tierName={limitInfo.tierName}
        />
      )}
    </>
  );
};

