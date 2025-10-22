'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomMCPToolsData } from '@/hooks/react-query/agents/use-custom-mcp-tools';

interface BaseToolsManagerProps {
  agentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolsUpdate?: (enabledTools: string[]) => void;
  versionData?: {
    configured_mcps?: any[];
    custom_mcps?: any[];
    system_prompt?: string;
    agentpress_tools?: any;
  };
  saveMode?: 'direct' | 'callback';
  versionId?: string;
  initialEnabledTools?: string[];
}

interface CustomToolsManagerProps extends BaseToolsManagerProps {
  mode: 'custom';
  mcpConfig: any;
  mcpName: string;
}

type ToolsManagerProps = CustomToolsManagerProps;

export const ToolsManager: React.FC<ToolsManagerProps> = (props) => {
  const { agentId, open, onOpenChange, onToolsUpdate, mode, versionData, saveMode = 'direct', versionId, initialEnabledTools } = props;

  const customResult = useCustomMCPToolsData(
    agentId,
    (props as CustomToolsManagerProps).mcpConfig
  );

  const result = customResult;
  const { data, isLoading, error, updateMutation, isUpdating, refetch } = result;

  const [localTools, setLocalTools] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleUpdateTools = async (enabledTools: string[]) => {
    const customMutation = updateMutation as any;
    return customMutation.mutateAsync(enabledTools);
  };

  React.useEffect(() => {
    if (data?.tools) {
      console.log('[ToolsManager] API data received:', {
        tools: data.tools,
        initialEnabledTools,
        mode,
        data
      });
      
      const toolsMap: Record<string, boolean> = {};
      data.tools.forEach((tool: { name: string; enabled: boolean }) => {
        toolsMap[tool.name] = tool.enabled;
        console.log(`[ToolsManager] Tool ${tool.name}: using API enabled=${tool.enabled}`);
      });
      
      console.log('[ToolsManager] Final toolsMap:', toolsMap);
      console.log('[ToolsManager] Setting localTools to:', toolsMap);
      setLocalTools(toolsMap);
      setHasChanges(false);
    }
  }, [data, initialEnabledTools, mode]);

  const enabledCount = useMemo(() => {
    return Object.values(localTools).filter(Boolean).length;
  }, [localTools]);

  const totalCount = data?.tools?.length || 0;
  
  const displayName = (props as CustomToolsManagerProps).mcpName;

  const handleToolToggle = (toolName: string) => {
    setLocalTools(prev => {
      const newValue = !prev[toolName];
      const updated = { ...prev, [toolName]: newValue };
      const comparisonState: Record<string, boolean> = {};
      data?.tools?.forEach((tool: any) => {
        if (initialEnabledTools && initialEnabledTools.length > 0) {
          comparisonState[tool.name] = initialEnabledTools.includes(tool.name);
        } else {
          comparisonState[tool.name] = tool.enabled;
        }
      });
      const hasChanges = Object.keys(updated).some(key => updated[key] !== comparisonState[key]);
      setHasChanges(hasChanges);
      return updated;
    });
  };

  const handleSelectAll = () => {
    if (!data?.tools) return;
    const allEnabled = data.tools.every((tool: any) => !!localTools[tool.name]);
    const newState: Record<string, boolean> = {};
    data.tools.forEach((tool: any) => {
      newState[tool.name] = !allEnabled;
    });
    setLocalTools(newState);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const enabledTools = Object.entries(localTools)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);
    
    if (saveMode === 'callback') {
      if (onToolsUpdate) {
        onToolsUpdate(enabledTools);
      }
      setHasChanges(false);
      onOpenChange(false);
    } else {
      try {
        await handleUpdateTools(enabledTools);
        setHasChanges(false);
        if (onToolsUpdate) {
          onToolsUpdate(enabledTools);
        }
      } catch (error) {
        console.error('Failed to save tools:', error);
      }
    }
  };

  const handleCancel = () => {
    if (data?.tools) {
      const resetState: Record<string, boolean> = {};
      data.tools.forEach((tool: any) => {
        if (initialEnabledTools && initialEnabledTools.length > 0) {
          resetState[tool.name] = initialEnabledTools.includes(tool.name);
        } else {
          resetState[tool.name] = tool.enabled;
        }
      });
      setLocalTools(resetState);
      setHasChanges(false);
    }
  };

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span>Erro ao Carregar Ferramentas</span>
            </DialogTitle>
            <DialogDescription>
              Falha ao carregar ferramentas do {displayName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {error?.message || 'Ocorreu um erro inesperado ao carregar as ferramentas.'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button 
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Configurar Ferramentas do {displayName}
          </DialogTitle>
          {versionData && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                As alterações criarão uma nova versão do agente.
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Carregando ferramentas disponíveis...</span>
              </div>
            </div>
          ) : !data?.tools?.length ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma ferramenta disponível para {displayName}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {enabledCount} de {totalCount} ferramentas ativadas
                    </span>
                    {hasChanges && (
                      <div className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Alterações não salvas
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isUpdating}
                  className="h-8 px-3 text-xs"
                >
                  {data.tools.every((tool: any) => localTools[tool.name]) ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {data.tools.map((tool: any) => (
                  <div
                    key={tool.name}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all duration-200",
                      localTools[tool.name] 
                        ? "bg-muted/50 border border-primary/20" 
                        : "bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-muted/30"
                    )}
                    onClick={() => handleToolToggle(tool.name)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{tool.name}</span>
                          {localTools[tool.name] && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={localTools[tool.name] || false}
                        onCheckedChange={() => handleToolToggle(tool.name)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {!data?.has_mcp_config && data?.tools?.length > 0 && saveMode === 'direct' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                  <Info className="h-3 w-3" />
                  <span>Isso irá atualizar a configuração MCP do seu agente</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={hasChanges ? handleCancel : () => onOpenChange(false)}
                disabled={isUpdating}
              >
                {hasChanges ? 'Cancelar' : 'Fechar'}
              </Button>
              
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : saveMode === 'callback' ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Aplicar Alterações
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
