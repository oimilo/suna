'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, Workflow, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export function AgentWorkflowsConfiguration({ agentId, agentName }: AgentWorkflowsConfigurationProps) {
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
  const [activeTab, setActiveTab] = useState('workflows');

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

  const handleUpdateWorkflowStatus = useCallback(async (workflowId: string, status: AgentWorkflow['status']) => {
    await updateWorkflowMutation.mutateAsync({ 
      agentId, 
      workflowId, 
      workflow: { status } 
    });
  }, [agentId, updateWorkflowMutation]);

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
    const colors = {
      draft: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800',
      active: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900',
      paused: 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900',
      archived: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900'
    };
    
    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <Button 
          size='sm' 
          variant='outline' 
          className="flex items-center gap-2" 
          onClick={handleCreateWorkflow}
          disabled={createWorkflowMutation.isPending}
        >
          <Plus className="h-4 w-4" />
          {createWorkflowMutation.isPending ? 'Criando...' : 'Criar Fluxo de Trabalho'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="workflows" className="space-y-4">
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
              <div className="grid gap-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="group">
                    <Card
                      className="p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleWorkflowClick(workflow.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold">{workflow.name}</h4>
                          <div className="flex items-center space-x-2 mt-2">
                            {getStatusBadge(workflow.status)}
                            {workflow.is_default && <Badge variant="outline">Default</Badge>}
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">{workflow.description}</p>
                          <div className="flex items-center text-xs mt-4">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteWorkflow(workflow);
                            }}
                            disabled={workflow.status !== 'active' || executeWorkflowMutation.isPending}
                          >
                            <Workflow className="h-4 w-4" />
                            Executar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkflow(workflow);
                            }}
                            disabled={deleteWorkflowMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
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