import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Server, Store } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MCPConfigurationProps, MCPConfiguration as MCPConfigurationType } from './types';
import { ConfiguredMcpList } from './configured-mcp-list';
import { CustomMCPDialog } from './custom-mcp-dialog';
// import { PipedreamRegistry } from '@/components/agents/pipedream/pipedream-registry';
import { ToolsManager } from './tools-manager';
import { toast } from 'sonner';

export const MCPConfigurationNew: React.FC<MCPConfigurationProps> = ({
  configuredMCPs,
  onConfigurationChange,
  agentId,
  versionData,
  saveMode = 'direct',
  versionId
}) => {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showRegistryDialog, setShowRegistryDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showPipedreamToolsManager, setShowPipedreamToolsManager] = useState(false);
  const [showCustomToolsManager, setShowCustomToolsManager] = useState(false);
  const [selectedMCPForTools, setSelectedMCPForTools] = useState<MCPConfigurationType | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(agentId);

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

  const handleEditMCP = (index: number) => {
    const mcp = configuredMCPs[index];
    setEditingIndex(index);
    setShowCustomDialog(true);
  };

  const handleConfigureTools = (index: number) => {
    const mcp = configuredMCPs[index];
    setSelectedMCPForTools(mcp);
    if (mcp.customType && mcp.customType !== 'pipedream') {
      setShowCustomToolsManager(true);
    } else {
      // Pipedream removido: não abrir mais gerenciador específico
      toast.warning('Integrações Pipedream foram descontinuadas. Use MCP personalizado ou Composio.');
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {configuredMCPs.length === 0 && (
          <div className="text-center py-12 px-6 bg-muted/30 rounded-xl border-2 border-dashed border-border">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Nenhuma integração configurada
            </h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Adicione servidores MCP personalizados (ou use o fluxo Composio pela Configuração do Agente)
            </p>
            <div className="flex gap-2 justify-center">
              {/* Registro de apps (Pipedream) desabilitado */}
              {/* <Button onClick={() => setShowRegistryDialog(true)} variant="default">
                <Store className="h-4 w-4" />
                Explorar Apps
              </Button> */}
              <Button onClick={() => setShowCustomDialog(true)} variant="outline">
                <Server className="h-4 w-4" />
                MCP Personalizado
              </Button>
            </div>
          </div>
        )}
        
        {configuredMCPs.length > 0 && (
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
      
      {configuredMCPs.length > 0 && (
        <div className="flex-shrink-0 pt-4">
          <div className="flex gap-2 justify-center">
            {/* Registro de apps (Pipedream) desabilitado */}
            {/* <Button onClick={() => setShowRegistryDialog(true)} variant="default">
              <Store className="h-4 w-4" />
              Explorar Apps
            </Button> */}
            <Button onClick={() => setShowCustomDialog(true)} variant="outline">
              <Server className="h-4 w-4" />
              MCP Personalizado
            </Button>
          </div>
        </div>
      )}
      
      {/* Dialog de registro Pipedream removido */}
      {/* <Dialog open={showRegistryDialog} onOpenChange={setShowRegistryDialog}>
        <DialogContent className="p-0 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Selecionar Integração</DialogTitle>
          </DialogHeader>
          <PipedreamRegistry showAgentSelector={false} selectedAgentId={selectedAgentId} onAgentChange={handleAgentChange} onToolsSelected={handleToolsSelected} versionData={versionData} versionId={versionId} />
        </DialogContent>
      </Dialog> */}
      <CustomMCPDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        onSave={handleSaveCustomMCP}
      />
      {selectedMCPForTools && selectedMCPForTools.customType && selectedMCPForTools.customType !== 'pipedream' && (
        <ToolsManager
          mode="custom"
          agentId={selectedAgentId}
          mcpConfig={{
            ...selectedMCPForTools.config,
            type: selectedMCPForTools.customType
          }}
          mcpName={selectedMCPForTools.name}
          open={showCustomToolsManager}
          onOpenChange={setShowCustomToolsManager}
          onToolsUpdate={(enabledTools) => {
            if (!selectedMCPForTools) return;
            const updatedMCPs = configuredMCPs.map(mcp => 
              mcp === selectedMCPForTools 
                ? { ...mcp, enabledTools }
                : mcp
            );
            onConfigurationChange(updatedMCPs);
            setShowCustomToolsManager(false);
            setSelectedMCPForTools(null);
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