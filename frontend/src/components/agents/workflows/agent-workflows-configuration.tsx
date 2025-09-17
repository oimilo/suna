'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, Workflow, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  useAgentWorkflows, 
  useCreateAgentWorkflow,
  useUpdateAgentWorkflow, 
  useDeleteAgentWorkflow, 
  useExecuteWorkflow, 
} from '@/hooks/react-query/agents/use-agent-workflows';
import { 
  AgentWorkflow
} from '@/hooks/react-query/agents/workflow-utils';

interface AgentWorkflowsConfigurationProps {
  agentId: string;
  agentName: string;
}

export function AgentWorkflowsConfiguration({ agentId }: AgentWorkflowsConfigurationProps) {
  const router = useRouter();

  const { data: workflows = [], isLoading } = useAgentWorkflows(agentId);
  const createWorkflowMutation = useCreateAgentWorkflow();
  const updateWorkflowMutation = useUpdateAgentWorkflow();
  const deleteWorkflowMutation = useDeleteAgentWorkflow();
  const executeWorkflowMutation = useExecuteWorkflow();

  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);
  const [workflowToExecute, setWorkflowToExecute] = useState<AgentWorkflow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<AgentWorkflow | null>(null);

  const [executionInput, setExecutionInput] = useState<string>('');

  const handleCreateWorkflow = useCallback(async () => {
    try {
      const defaultWorkflow = {
        name: 'Untitled Workflow',
        description: 'A new workflow',
        steps: []
      };
      const newWorkflow = await createWorkflowMutation.mutateAsync({ 
        agentId, 
        workflow: defaultWorkflow 
      });
      
      // Auto-activate the workflow after creation
      try {
        await updateWorkflowMutation.mutateAsync({
          agentId,
          workflowId: newWorkflow.id,
          workflow: { status: 'active' }
        });
      } catch (activationError) {
        console.warn('Failed to auto-activate workflow:', activationError);
        // Continue anyway, the workflow was created successfully
      }
      
      router.push(`/agents/config/${agentId}/workflow/${newWorkflow.id}`);
    } catch (error) {
      toast.error('Failed to create workflow');
    }
  }, [agentId, router, createWorkflowMutation, updateWorkflowMutation]);


  const handleExecuteWorkflow = useCallback((workflow: AgentWorkflow) => {
    setWorkflowToExecute(workflow);
    setIsExecuteDialogOpen(true);
  }, []);

  const handleWorkflowClick = useCallback((workflowId: string) => {
    router.push(`/agents/config/${agentId}/workflow/${workflowId}`);
  }, [agentId, router]);

  const handleDeleteWorkflow = useCallback((workflow: AgentWorkflow) => {
    setWorkflowToDelete(workflow);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!workflowToDelete) return;
    
    try {
      await deleteWorkflowMutation.mutateAsync({ agentId, workflowId: workflowToDelete.id });
      toast.success('Workflow deleted successfully');
      setIsDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  }, [agentId, workflowToDelete, deleteWorkflowMutation]);

  const handleConfirmExecution = useCallback(async () => {
    if (!workflowToExecute) return;
    
    try {
      const result = await executeWorkflowMutation.mutateAsync({ 
        agentId, 
        workflowId: workflowToExecute.id, 
        execution: {
          input_data: executionInput.trim() ? { prompt: executionInput } : undefined
        } 
      });
      
      setIsExecuteDialogOpen(false);
      setWorkflowToExecute(null);
      setExecutionInput('');
      
      toast.success(`${result.message}`);
    } catch (error) {
      toast.error('Failed to execute workflow');
    }
  }, [agentId, workflowToExecute, executionInput, executeWorkflowMutation]);



  const getStatusBadge = (status: AgentWorkflow['status']) => {
    const statusConfig = {
      draft: {
        className: 'bg-muted/50 text-muted-foreground border border-border',
        label: 'Rascunho'
      },
      active: {
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        label: 'Ativo'
      },
      paused: {
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        label: 'Pausado'
      },
      archived: {
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
        label: 'Arquivado'
      }
    };
    
    const config = statusConfig[status];
    
    return (
      <div className={`px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end mb-4">
        <Button 
          size="sm" 
          variant="default" 
          className="h-9 px-3 gap-1.5 text-sm font-medium" 
          onClick={handleCreateWorkflow}
          disabled={createWorkflowMutation.isPending}
        >
          <Plus className="h-3.5 w-3.5" />
          {createWorkflowMutation.isPending ? 'Criando...' : 'Criar Fluxo de Trabalho'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 animate-spin" />
                  <span>Carregando fluxos de trabalho...</span>
                </div>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-12 px-6 bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 border">
                  <Workflow className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold mb-2">Nenhum Fluxo de Trabalho do Agente</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Crie fluxos de trabalho para automatizar tarefas e otimizar as operações do seu agente.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {workflows.map((workflow) => (
                  <div 
                    key={workflow.id} 
                    className="group p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                    onClick={() => handleWorkflowClick(workflow.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Ícone */}
                      <div className="p-2 rounded-md bg-transparent opacity-60 shrink-0">
                        <Workflow className="h-4 w-4" />
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium truncate">
                              {workflow.name}
                            </h4>
                            {getStatusBadge(workflow.status)}
                            {workflow.is_default && (
                              <div className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Padrão
                              </div>
                            )}
                          </div>
                          
                          {/* Ações */}
                          <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecuteWorkflow(workflow);
                              }}
                              disabled={workflow.status !== 'active' || executeWorkflowMutation.isPending}
                              className="h-7 px-2 hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <Workflow className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                              <span className="text-xs">Executar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkflow(workflow);
                              }}
                              disabled={deleteWorkflowMutation.isPending}
                              className="h-7 w-7 p-0 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5 opacity-60" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Descrição */}
                        {workflow.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {workflow.description}
                          </p>
                        )}
                        
                        {/* Data de criação */}
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground/60">
                          <Calendar className="h-3 w-3" />
                          <span>Criado em {new Date(workflow.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>
      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Executar Fluxo de Trabalho</DialogTitle>
            <DialogDescription>
              Forneça dados de entrada para o fluxo de trabalho "{workflowToExecute?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Em que você gostaria que o fluxo de trabalho trabalhasse?</Label>
              <Textarea
                value={executionInput}
                onChange={(e) => setExecutionInput(e.target.value)}
                placeholder="Digite sua solicitação..."
                rows={4}
                className="resize-none"
                required={true}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsExecuteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmExecution}
                disabled={executeWorkflowMutation.isPending}
              >
                {executeWorkflowMutation.isPending ? 'Executando...' : 'Executar Fluxo de Trabalho'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Fluxo de Trabalho</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o fluxo de trabalho {workflowToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteWorkflowMutation.isPending}
            >
              {deleteWorkflowMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 