'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings2, Brain, Database, Zap, Bot } from 'lucide-react';
import { BRANDING } from '@/lib/branding';
import { AgentMCPConfiguration } from './agent-mcp-configuration';
import { AgentTriggersConfiguration } from './triggers/agent-triggers-configuration';
import { AgentKnowledgeBaseManager } from './knowledge-base/agent-knowledge-base-manager';
import { AgentToolsConfiguration } from './agent-tools-configuration';
import { AgentSelector } from '../thread/chat-input/agent-selector';
import { useAgent, useUpdateAgent } from '@/hooks/react-query/agents/use-agents';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AgentConfigModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAgentId?: string;
  onAgentSelect?: (agentId: string | undefined) => void;
  initialTab?: string;
  isSunaAgent?: boolean;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onOpenChange,
  selectedAgentId,
  onAgentSelect,
  initialTab = 'tools',
  isSunaAgent
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instructionsValue, setInstructionsValue] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  
  const { data: agent, isLoading } = useAgent(selectedAgentId || '');
  const updateAgentMutation = useUpdateAgent();
  const router = useRouter();

  // Update active tab when initialTab changes or modal opens
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Update local state when agent data changes
  React.useEffect(() => {
    if (agent) {
      setAgentName(agent.name || '');
      setAgentDescription(agent.description || '');
      setInstructionsValue(agent.system_prompt || '');
    }
  }, [agent]);

  const handleSaveInstructions = async () => {
    if (!selectedAgentId) return;
    
    try {
      await updateAgentMutation.mutateAsync({
        agentId: selectedAgentId,
        name: agentName,
        description: agentDescription,
        system_prompt: instructionsValue
      });
      toast.success('Agente atualizado com sucesso');
      setEditingInstructions(false);
    } catch (error) {
      toast.error('Falha ao atualizar agente');
    }
  };

  const handleToolsChange = async (tools: Record<string, { enabled: boolean; description: string }>) => {
    if (!selectedAgentId) return;
    
    try {
      await updateAgentMutation.mutateAsync({
        agentId: selectedAgentId,
        agentpress_tools: tools
      });
      toast.success('Ferramentas atualizadas com sucesso');
    } catch (error) {
      toast.error('Falha ao atualizar ferramentas');
    }
  };

  const handleMCPChange = async (mcps: any) => {
    if (!selectedAgentId) return;
    
    try {
      await updateAgentMutation.mutateAsync({
        agentId: selectedAgentId,
        configured_mcps: mcps.configured_mcps || [],
        custom_mcps: mcps.custom_mcps || []
      });
      toast.success('Integrações atualizadas com sucesso');
    } catch (error) {
      toast.error('Falha ao atualizar integrações');
    }
  };

  const displayName = agent?.name || BRANDING.name;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col bg-background/95 backdrop-blur-sm border-black/6 dark:border-white/8">
        <DialogHeader className="flex-shrink-0 border-b border-black/6 dark:border-white/8 px-6 py-4 bg-black/[0.02] dark:bg-white/[0.03]">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-black/[0.03] dark:bg-white/[0.05]">
                <Bot className="h-4 w-4 opacity-70" />
              </div>
              <span className="text-base font-semibold">Configuração do Agente</span>
            </div>
            {selectedAgentId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/agents/config/${selectedAgentId}`)}
                className="h-8 px-3 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
              >
                <Settings2 className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                Avançado
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-shrink-0 px-6 py-3 border-b">
          <AgentSelector
            selectedAgentId={selectedAgentId}
            onAgentSelect={onAgentSelect}
            isSunaAgent={isSunaAgent}
          />
        </div>

        <div className="flex-1 min-h-0 px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0 h-9 mb-4">
              <TabsTrigger value="tools" className="text-xs">
                <Settings2 className="h-3 w-3 mr-1" />
                Ferramentas
              </TabsTrigger>
              <TabsTrigger value="instructions" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                Instruções
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                Conhecimento
              </TabsTrigger>
              <TabsTrigger value="triggers" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Gatilhos
              </TabsTrigger>
              {null}
            </TabsList>

            <TabsContent value="tools" className="flex-1 m-0 mt-0 overflow-y-auto overflow-hidden">
              <div className="h-full">
                {selectedAgentId ? (
                  <AgentToolsConfiguration
                    tools={agent?.agentpress_tools || {}}
                    onToolsChange={handleToolsChange}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">Selecione um agente para configurar ferramentas</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="instructions" className="flex-1 m-0 mt-0 overflow-y-auto overflow-hidden">
              <div className="h-full flex flex-col">
                {selectedAgentId ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="agent-name" className="text-sm">Nome</Label>
                        <Input
                          id="agent-name"
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                          placeholder="Nome do agente"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agent-description" className="text-sm">Descrição</Label>
                        <Input
                          id="agent-description"
                          value={agentDescription}
                          onChange={(e) => setAgentDescription(e.target.value)}
                          placeholder="Breve descrição"
                          className="h-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 flex-1 flex flex-col">
                      <Label htmlFor="system-instructions" className="text-sm">Instruções do Sistema</Label>
                      <Textarea
                        id="system-instructions"
                        value={instructionsValue}
                        onChange={(e) => setInstructionsValue(e.target.value)}
                        placeholder="Defina o papel, comportamento e especialização do agente..."
                        className="flex-1 resize-none"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSaveInstructions}
                        disabled={updateAgentMutation.isPending}
                        size="sm"
                      >
                        {updateAgentMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAgentName(agent?.name || '');
                          setAgentDescription(agent?.description || '');
                          setInstructionsValue(agent?.system_prompt || '');
                        }}
                      >
                        Redefinir
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">Selecione um agente para configurar instruções</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="knowledge" className="flex-1 m-0 mt-0 overflow-y-auto overflow-hidden">
              <div className="h-full">
                {selectedAgentId ? (
                  <AgentKnowledgeBaseManager
                    agentId={selectedAgentId}
                    agentName={agentName}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">Selecione um agente para gerenciar base de conhecimento</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="triggers" className="flex-1 m-0 mt-0 overflow-y-auto overflow-hidden">
              <div className="h-full">
                {selectedAgentId ? (
                  <AgentTriggersConfiguration agentId={selectedAgentId} />
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">Selecione um agente para configurar gatilhos</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {null}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 