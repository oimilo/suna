import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Server, Store } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MCPConfigurationProps, MCPConfiguration as MCPConfigurationType } from './types';
import { ConfiguredMcpList } from './configured-mcp-list';
import { CustomMCPDialog } from './custom-mcp-dialog';
import { ToolsManager } from './tools-manager';
import { toast } from 'sonner';
import { ComposioRegistry } from '../composio/composio-registry';
import { ComposioToolsManager } from '../composio/composio-tools-manager';
import { useQueryClient } from '@tanstack/react-query';

const resolveMcpType = (mcp: MCPConfigurationType) => {
  if (mcp.customType) return mcp.customType;
  if (mcp.isComposio) return 'composio';

  const qualified =
    mcp.mcp_qualified_name ||
    mcp.qualifiedName ||
    mcp.config?.mcp_qualified_name ||
    mcp.config?.qualifiedName;

  if (qualified?.startsWith('composio.')) return 'composio';
  if (mcp.config?.type === 'composio') return 'composio';

  if (mcp.config?.type === 'http' || mcp.config?.type === 'sse') {
    return mcp.config.type;
  }

  return undefined;
};

const resolveToolkitSlug = (mcp: MCPConfigurationType): string | undefined => {
  if (mcp.toolkitSlug) return mcp.toolkitSlug;
  if (mcp.config?.toolkit_slug) return mcp.config.toolkit_slug;
  if (mcp.config?.toolkitSlug) return mcp.config.toolkitSlug;

  const qualified =
    mcp.mcp_qualified_name ||
    mcp.qualifiedName ||
    mcp.config?.mcp_qualified_name ||
    mcp.config?.qualifiedName;

  if (qualified?.startsWith('composio.')) {
    return qualified.slice('composio.'.length);
  }

  return undefined;
};

export const MCPConfigurationNew: React.FC<MCPConfigurationProps> = ({
  configuredMCPs,
  onConfigurationChange,
  agentId,
  versionData,
  saveMode = 'direct',
  versionId,
}) => {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showRegistryDialog, setShowRegistryDialog] = useState(false);
  const [showComposioToolsManager, setShowComposioToolsManager] = useState(false);
  const [showCustomToolsManager, setShowCustomToolsManager] = useState(false);
  const [selectedMCPForTools, setSelectedMCPForTools] = useState<MCPConfigurationType | null>(null);
  const [selectedMCPIndex, setSelectedMCPIndex] = useState<number | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(agentId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (agentId !== selectedAgentId) {
      setSelectedAgentId(agentId);
    }
  }, [agentId, selectedAgentId]);

  const handleAgentChange = (newAgentId: string | undefined) => {
    if (newAgentId !== selectedAgentId) {
      setSelectedAgentId(newAgentId);
    }
  };

  const handleEditMCP = (_index: number) => {
    setShowCustomDialog(true);
  };

  const handleConfigureTools = (index: number) => {
    const originalMcp = configuredMCPs[index];
    const detectedType = resolveMcpType(originalMcp);
    const mcp =
      detectedType && detectedType !== originalMcp.customType
        ? { ...originalMcp, customType: detectedType as MCPConfigurationType['customType'] }
        : originalMcp;

    setSelectedMCPForTools(mcp);

    if (detectedType === 'composio') {
      if (!selectedAgentId) {
        toast.error('Selecione um agente para gerenciar ferramentas Composio.');
        setSelectedMCPForTools(null);
        setSelectedMCPIndex(null);
        return;
      }
      const profileId = mcp.selectedProfileId || mcp.config?.profile_id;
      if (profileId) {
        setShowComposioToolsManager(true);
      } else {
        toast.error('Não encontramos o profile conectado para esse MCP Composio.');
        setSelectedMCPForTools(null);
        setSelectedMCPIndex(null);
      }
    } else if (detectedType) {
      setShowCustomToolsManager(true);
    } else {
      toast.info('Esta integração não possui configurações de ferramentas editáveis.');
      setSelectedMCPForTools(null);
      setSelectedMCPIndex(null);
    }
  };

  const handleRemoveMCP = (index: number) => {
    const newMCPs = [...configuredMCPs];
    newMCPs.splice(index, 1);
    onConfigurationChange(newMCPs);
  };

  const handleSaveCustomMCP = (customConfig: any) => {
    const mcpConfig: MCPConfigurationType = {
      name: customConfig.name,
      qualifiedName: `custom_${customConfig.type}_${Date.now()}`,
      config: customConfig.config,
      enabledTools: customConfig.enabledTools,
      selectedProfileId: customConfig.selectedProfileId,
      isCustom: true,
      customType: customConfig.type as 'http' | 'sse'
    };
    onConfigurationChange([...configuredMCPs, mcpConfig]);
  };

  const handleToolsSelected = (profileId: string, selectedTools: string[], appName: string, appSlug: string) => {
    setShowRegistryDialog(false);
    if (selectedAgentId) {
      queryClient.invalidateQueries({ queryKey: ['agents', 'detail', selectedAgentId] });
    }
    queryClient.invalidateQueries({ queryKey: ['composio', 'profiles'] });
    toast.success(`Integração ${appName} conectada!`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button onClick={() => setShowRegistryDialog(true)} variant="default" className="gap-2">
            <Store className="h-4 w-4" />
            Explorar Apps
          </Button>
          <Button onClick={() => setShowCustomDialog(true)} variant="outline" className="gap-2">
            <Server className="h-4 w-4" />
            MCP Personalizado
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {configuredMCPs.length === 0 ? (
          <div className="text-center py-12 px-6 bg-muted/30 rounded-xl border-2 border-dashed border-border">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-medium text-foreground mb-2">Nenhuma integração configurada</h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Conecte apps via Composio ou cadastre um servidor MCP personalizado para liberar ferramentas no agente.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowRegistryDialog(true)} variant="default" className="gap-2">
                <Store className="h-4 w-4" />
                Explorar Apps
              </Button>
              <Button onClick={() => setShowCustomDialog(true)} variant="outline" className="gap-2">
                <Server className="h-4 w-4" />
                MCP Personalizado
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ConfiguredMcpList
              configuredMCPs={configuredMCPs}
              onEdit={handleEditMCP}
              onRemove={handleRemoveMCP}
              onConfigureTools={handleConfigureTools}
            />
          </div>
        )}
      </div>

      <Dialog open={showRegistryDialog} onOpenChange={setShowRegistryDialog}>
        <DialogContent className="p-0 max-w-6xl h-[90vh] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Explorar Integrações</DialogTitle>
          </DialogHeader>
          <ComposioRegistry
            showAgentSelector={false}
            selectedAgentId={selectedAgentId}
            onAgentChange={handleAgentChange}
            onToolsSelected={handleToolsSelected}
            onClose={() => setShowRegistryDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <CustomMCPDialog open={showCustomDialog} onOpenChange={setShowCustomDialog} onSave={handleSaveCustomMCP} />

      {selectedMCPForTools &&
        resolveMcpType(selectedMCPForTools) === 'composio' &&
        (selectedMCPForTools.selectedProfileId || selectedMCPForTools.config?.profile_id) && (
          <ComposioToolsManager
            agentId={selectedAgentId || ''}
            open={showComposioToolsManager}
            onOpenChange={(open) => {
              setShowComposioToolsManager(open);
              if (!open) {
                setSelectedMCPForTools(null);
                setSelectedMCPIndex(null);
              }
            }}
            profileId={selectedMCPForTools.selectedProfileId || selectedMCPForTools.config?.profile_id}
            profileInfo={
              selectedMCPForTools.config?.profile_id
                ? {
                    profile_id: selectedMCPForTools.config.profile_id,
                    profile_name:
                      selectedMCPForTools.config.profile_name || selectedMCPForTools.name || 'Composio Profile',
                    toolkit_name:
                      selectedMCPForTools.config.toolkit_name || selectedMCPForTools.name || 'Toolkit',
                    toolkit_slug: resolveToolkitSlug(selectedMCPForTools),
                  }
                : undefined
            }
            appLogo={selectedMCPForTools.config?.toolkit_logo}
            onToolsUpdate={() => {
              if (selectedAgentId) {
                queryClient.invalidateQueries({ queryKey: ['agents', 'detail', selectedAgentId] });
              }
              setShowComposioToolsManager(false);
              setSelectedMCPForTools(null);
              setSelectedMCPIndex(null);
            }}
          />
        )}

      {selectedMCPForTools &&
        (() => {
          const type = resolveMcpType(selectedMCPForTools);
          return type && type !== 'composio';
        })() && (
          <ToolsManager
            mode="custom"
            agentId={selectedAgentId || ''}
            mcpConfig={{
              ...selectedMCPForTools.config,
              type: resolveMcpType(selectedMCPForTools),
            }}
            mcpName={selectedMCPForTools.name}
            open={showCustomToolsManager}
            onOpenChange={(open) => {
              setShowCustomToolsManager(open);
              if (!open) {
                setSelectedMCPForTools(null);
                setSelectedMCPIndex(null);
              }
            }}
            onToolsUpdate={(enabledTools) => {
              if (selectedMCPIndex === null) return;
              const updatedMCPs = configuredMCPs.map((mcp, idx) =>
                idx === selectedMCPIndex ? { ...mcp, enabledTools } : mcp,
              );
              onConfigurationChange(updatedMCPs);
              setShowCustomToolsManager(false);
              setSelectedMCPForTools(null);
              setSelectedMCPIndex(null);
            }}
            versionData={versionData}
            saveMode={saveMode}
            versionId={versionId}
            initialEnabledTools={selectedMCPForTools.enabledTools}
          />
        )}
    </div>
  );
};
