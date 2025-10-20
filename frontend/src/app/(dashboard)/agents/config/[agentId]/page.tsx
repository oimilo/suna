'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpdateAgent } from '@/hooks/react-query/agents/use-agents';
import { BRANDING } from '@/lib/branding';
import { useCreateAgentVersion, useActivateAgentVersion } from '@/hooks/react-query/agents/use-agent-versions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getAgentAvatar } from '../../../../../lib/utils/get-agent-style';
import { AgentPreview } from '../../../../../components/agents/agent-preview';
import { AgentVersionSwitcher } from '@/components/agents/agent-version-switcher';
import { CreateVersionButton } from '@/components/agents/create-version-button';
import { useAgentVersionData } from '../../../../../hooks/use-agent-version-data';
import { useSearchParams } from 'next/navigation';
import { useAgentVersionStore } from '../../../../../lib/stores/agent-version-store';
import { cn } from '@/lib/utils';

import { AgentHeader, VersionAlert, AgentBuilderTab, ConfigurationTab } from '@/components/agents/config';
import { UpcomingRunsDropdown } from '@/components/agents/upcoming-runs-dropdown';

interface FormData {
  name: string;
  description: string;
  system_prompt: string;
  agentpress_tools: any;
  configured_mcps: any[];
  custom_mcps: any[];
  is_default: boolean;
  avatar: string;
  avatar_color: string;
}

export default function AgentConfigurationPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const queryClient = useQueryClient();
  // Removido uso de sidebar context para permitir links compartilhados
  const isPinned = false;
  const setIsPinned = () => {};

  const { agent, versionData, isViewingOldVersion, isLoading, error } = useAgentVersionData({ agentId });
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialAccordion = searchParams.get('accordion');
  const { hasUnsavedChanges, setHasUnsavedChanges } = useAgentVersionStore();
  
  const updateAgentMutation = useUpdateAgent();
  const createVersionMutation = useCreateAgentVersion();
  const activateVersionMutation = useActivateAgentVersion();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    system_prompt: '',
    agentpress_tools: {},
    configured_mcps: [],
    custom_mcps: [],
    is_default: false,
    avatar: '',
    avatar_color: '',
  });

  const [originalData, setOriginalData] = useState<FormData>(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Initialize active tab from URL param, default to 'configuration'
  const initialTab = tabParam === 'agent-builder' ? 'agent-builder' : 'configuration';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (!agent) return;
    let configSource = agent;
    if (versionData) {
      configSource = versionData;
    } 
    else if (agent.current_version) {
      configSource = agent.current_version;
    }
    
    const initialData: FormData = {
      name: agent.name || '',
      description: agent.description || '',
      system_prompt: configSource.system_prompt || '',
      agentpress_tools: configSource.agentpress_tools || {},
      configured_mcps: configSource.configured_mcps || [],
      custom_mcps: configSource.custom_mcps || [],
      is_default: agent.is_default || false,
      avatar: agent.avatar || '',
      avatar_color: agent.avatar_color || '',
    };
    
    setFormData(initialData);
    setOriginalData(initialData);
  }, [agent, versionData]);

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData, setHasUnsavedChanges]);

  const handleSave = useCallback(async () => {
    if (!agent || isViewingOldVersion) return;
    
    const isSunaAgent = agent?.metadata?.is_suna_default || false;
    const restrictions = agent?.metadata?.restrictions || {};
    
    if (isSunaAgent) {
      if (restrictions.name_editable === false && formData.name !== originalData.name) {
        toast.error("Não é possível salvar alterações", {
          description: `O nome de ${BRANDING.name} não pode ser modificado.`,
        });
        return;
      }
      if (restrictions.system_prompt_editable === false && formData.system_prompt !== originalData.system_prompt) {
        toast.error("Não é possível salvar alterações", {
          description: `O prompt do sistema de ${BRANDING.name} não pode ser modificado.`,
        });
        return;
      }
      if (restrictions.tools_editable === false && JSON.stringify(formData.agentpress_tools) !== JSON.stringify(originalData.agentpress_tools)) {
        toast.error("Não é possível salvar alterações", {
          description: `As ferramentas padrão de ${BRANDING.name} não podem ser modificadas.`,
        });
        return;
      }
    }
    
    setIsSaving(true);
    try {
      const normalizedCustomMcps = (formData.custom_mcps || []).map(mcp => ({
        name: mcp.name || 'Unnamed MCP',
        type: mcp.type || mcp.customType || 'sse',
        config: mcp.config || {},
        enabledTools: Array.isArray(mcp.enabledTools) ? mcp.enabledTools : [],
      }));
      const newVersion = await createVersionMutation.mutateAsync({
        agentId,
        data: {
          system_prompt: formData.system_prompt,
          configured_mcps: formData.configured_mcps,
          custom_mcps: normalizedCustomMcps,
          agentpress_tools: formData.agentpress_tools,
          description: 'Manual save'
        }
      });
      const updatedAgent = await updateAgentMutation.mutateAsync({
        agentId,
        name: formData.name,
        description: formData.description,
        is_default: formData.is_default,
        avatar: formData.avatar,
        avatar_color: formData.avatar_color
      });
      queryClient.setQueryData(['agent', agentId], {
        ...updatedAgent,
        current_version: newVersion,
        current_version_id: newVersion.versionId
      });
      
      setOriginalData(formData);
      toast.success('Alterações salvas com sucesso');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Falha ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  }, [agent, formData, originalData, isViewingOldVersion, agentId, createVersionMutation, updateAgentMutation, queryClient]);

  const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
    if (isViewingOldVersion) {
      toast.error('Não é possível editar versões antigas. Por favor, ative esta versão primeiro para fazer alterações.');
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [isViewingOldVersion]);

  const handleMCPChange = useCallback((updates: { configured_mcps: any[]; custom_mcps: any[] }) => {
    if (isViewingOldVersion) {
      toast.error('Não é possível editar versões antigas. Por favor, ative esta versão primeiro para fazer alterações.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      configured_mcps: updates.configured_mcps,
      custom_mcps: updates.custom_mcps
    }));
  }, [isViewingOldVersion]);

  const handleStyleChange = useCallback((emoji: string, color: string) => {
    if (isViewingOldVersion) {
      toast.error('Não é possível editar versões antigas. Por favor, ative esta versão primeiro para fazer alterações.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      avatar: emoji,
      avatar_color: color
    }));
  }, [isViewingOldVersion]);

  const handleActivateVersion = useCallback(async (versionId: string) => {
    try {
      await activateVersionMutation.mutateAsync({ agentId, versionId });
    } catch (error) {
      toast.error('Falha ao ativar versão');
    }
  }, [agentId, activateVersionMutation]);

  useEffect(() => {
    if (isViewingOldVersion && activeTab === 'agent-builder') {
      setActiveTab('configuration');
    }
  }, [isViewingOldVersion, activeTab]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {error.message || 'Falha ao carregar configuração do agente'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando configuração do agente...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="max-w-md">
          <AlertDescription>Agente não encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayData = isViewingOldVersion && versionData ? {
    name: agent?.name || '',
    description: agent?.description || '',
    system_prompt: versionData.system_prompt || '',
    agentpress_tools: versionData.agentpress_tools || {},
    configured_mcps: versionData.configured_mcps || [],
    custom_mcps: versionData.custom_mcps || [],
    is_default: agent?.is_default || false,
    avatar: agent?.avatar || '',
    avatar_color: agent?.avatar_color || '',
  } : formData;

  const currentStyle = displayData.avatar && displayData.avatar_color
    ? { avatar: displayData.avatar, color: displayData.avatar_color }
    : getAgentAvatar(agentId);

  const previewAgent = {
    ...agent,
    ...displayData,
    agent_id: agentId,
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden lg:flex w-full h-full">
          <div className="w-2/5 border-r border-border/40 bg-background h-full flex flex-col">
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    {/* Version control and upcoming runs hidden for cleaner UI */}
                    <div className="flex items-center gap-2">
                      {/* {!agent?.metadata?.is_suna_default && (
                        <AgentVersionSwitcher
                          agentId={agentId}
                          currentVersionId={agent?.current_version_id}
                          currentFormData={{
                            system_prompt: formData.system_prompt,
                            configured_mcps: formData.configured_mcps,
                            custom_mcps: formData.custom_mcps,
                            agentpress_tools: formData.agentpress_tools
                          }}
                        />
                      )}
                      <CreateVersionButton
                        agentId={agentId}
                        currentFormData={{
                          system_prompt: formData.system_prompt,
                          configured_mcps: formData.configured_mcps,
                          custom_mcps: formData.custom_mcps,
                          agentpress_tools: formData.agentpress_tools
                        }}
                        hasChanges={hasUnsavedChanges && !isViewingOldVersion}
                        onVersionCreated={() => {
                          setOriginalData(formData);
                        }}
                      />
                      <UpcomingRunsDropdown agentId={agentId} /> */}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasUnsavedChanges && !isViewingOldVersion && (
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {isSaving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          Salvar
                        </Button>
                      )}
                    </div>
                  </div>
                  {isViewingOldVersion && (
                    <VersionAlert
                      versionData={versionData}
                      isActivating={activateVersionMutation.isPending}
                      onActivateVersion={handleActivateVersion}
                    />
                  )}
                  <AgentHeader
                    agentId={agentId}
                    displayData={displayData}
                    currentStyle={currentStyle}
                    isViewingOldVersion={isViewingOldVersion}
                    onFieldChange={handleFieldChange}
                    onStyleChange={handleStyleChange}
                    agentMetadata={agent?.metadata}
                    isPinned={isPinned}
                    setIsPinned={setIsPinned}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                  <TabsContent value="agent-builder" className="flex-1 h-0 m-0">
                    <AgentBuilderTab
                      agentId={agentId}
                      displayData={displayData}
                      currentStyle={currentStyle}
                      isViewingOldVersion={isViewingOldVersion}
                      onFieldChange={handleFieldChange}
                      onStyleChange={handleStyleChange}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  </TabsContent>
                  <TabsContent value="configuration" className="flex-1 h-0 m-0 overflow-y-auto">
                    <ConfigurationTab
                      agentId={agentId}
                      displayData={displayData}
                      versionData={versionData}
                      isViewingOldVersion={isViewingOldVersion}
                      onFieldChange={handleFieldChange}
                      onMCPChange={handleMCPChange}
                      initialAccordion={initialAccordion}
                      agentMetadata={agent?.metadata}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          <div className="w-3/5 bg-muted/30 overflow-y-auto">
            <div className="h-full">
              {previewAgent && (
                <AgentPreview 
                  agent={previewAgent} 
                  agentMetadata={agent?.metadata}
                  onFieldChange={handleFieldChange}
                  onStyleChange={handleStyleChange}
                  isViewingOldVersion={isViewingOldVersion}
                  currentStyle={currentStyle}
                />
              )}
            </div>
          </div>
        </div>
        <div className="lg:hidden flex flex-col h-full w-full">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  {/* Version control and upcoming runs hidden for cleaner UI */}
                  <div className="flex items-center gap-2">
                    {/* <AgentVersionSwitcher
                      agentId={agentId}
                      currentVersionId={agent?.current_version_id}
                      currentFormData={{
                        system_prompt: formData.system_prompt,
                        configured_mcps: formData.configured_mcps,
                        custom_mcps: formData.custom_mcps,
                        agentpress_tools: formData.agentpress_tools
                      }}
                    />
                    <CreateVersionButton
                      agentId={agentId}
                      currentFormData={{
                        system_prompt: formData.system_prompt,
                        configured_mcps: formData.configured_mcps,
                        custom_mcps: formData.custom_mcps,
                        agentpress_tools: formData.agentpress_tools
                      }}
                      hasChanges={hasUnsavedChanges && !isViewingOldVersion}
                      onVersionCreated={() => {
                        setOriginalData(formData);
                      }}
                    />
                    <UpcomingRunsDropdown agentId={agentId} /> */}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && !isViewingOldVersion && (
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Salvar
                      </Button>
                    )}
                  </div>
                </div>

                {isViewingOldVersion && (
                  <VersionAlert
                    versionData={versionData}
                    isActivating={activateVersionMutation.isPending}
                    onActivateVersion={handleActivateVersion}
                  />
                )}

                <AgentHeader
                  agentId={agentId}
                  displayData={displayData}
                  currentStyle={currentStyle}
                  isViewingOldVersion={isViewingOldVersion}
                  onFieldChange={handleFieldChange}
                  onStyleChange={handleStyleChange}
                  agentMetadata={agent?.metadata}
                  isPinned={isPinned}
                  setIsPinned={setIsPinned}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <TabsContent value="agent-builder" className="flex-1 h-0 m-0">
                  <AgentBuilderTab
                    agentId={agentId}
                    displayData={displayData}
                    currentStyle={currentStyle}
                    isViewingOldVersion={isViewingOldVersion}
                    onFieldChange={handleFieldChange}
                    onStyleChange={handleStyleChange}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </TabsContent>
                <TabsContent value="configuration" className="flex-1 h-0 m-0 overflow-y-auto">
                  <ConfigurationTab
                    agentId={agentId}
                    displayData={displayData}
                    versionData={versionData}
                    isViewingOldVersion={isViewingOldVersion}
                    onFieldChange={handleFieldChange}
                    onMCPChange={handleMCPChange}
                    initialAccordion={initialAccordion}
                    agentMetadata={agent?.metadata}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <Drawer open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DrawerTrigger asChild>
              <Button 
                className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 bg-primary hover:bg-primary/90"
                size="icon"
              >
                <Eye className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh]">
              <DrawerHeader className="border-b">
                <DrawerTitle>Agent Preview</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto p-4">
                {previewAgent && (
                  <AgentPreview 
                    agent={previewAgent} 
                    agentMetadata={agent?.metadata}
                    onFieldChange={handleFieldChange}
                    onStyleChange={handleStyleChange}
                    isViewingOldVersion={isViewingOldVersion}
                    currentStyle={currentStyle}
                  />
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
} 