import React from 'react';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_AGENTPRESS_TOOLS, getToolDisplayName } from './tools';
import { toast } from 'sonner';
import { BRANDING } from '@/lib/branding';

interface AgentToolsConfigurationProps {
  tools: Record<string, { enabled: boolean; description: string }>;
  onToolsChange: (tools: Record<string, { enabled: boolean; description: string }>) => void;
  disabled?: boolean;
  isSunaAgent?: boolean;
}

export const AgentToolsConfiguration = ({ tools, onToolsChange, disabled = false, isSunaAgent = false }: AgentToolsConfigurationProps) => {
  const searchQuery: string = ''; // Removed search for now since it's not being used

  const handleToolToggle = (toolName: string, enabled: boolean) => {
    if (disabled && isSunaAgent) {
      toast.error("Ferramentas não podem ser modificadas", {
        description: `As ferramentas padrão do ${BRANDING.name} são gerenciadas centralmente e não podem ser alteradas.`,
      });
      return;
    }
    
    const updatedTools = {
      ...tools,
      [toolName]: {
        ...tools[toolName],
        enabled
      }
    };
    onToolsChange(updatedTools);
  };

  const getSelectedToolsCount = (): number => {
    return Object.values(tools).filter(tool => tool.enabled).length;
  };

  const getFilteredTools = (): Array<[string, any]> => {
    let toolEntries = Object.entries(DEFAULT_AGENTPRESS_TOOLS);
    
    if (searchQuery) {
      toolEntries = toolEntries.filter(([toolName, toolInfo]) => 
        getToolDisplayName(toolName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        toolInfo.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return toolEntries;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-3">
        <span className="text-xs text-muted-foreground">
          {getSelectedToolsCount()} selecionadas
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {getFilteredTools().map(([toolName, toolInfo]) => (
            <div 
              key={toolName} 
              className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-transparent opacity-60 shrink-0">
                  <span className="text-xl">{toolInfo.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">
                      {getToolDisplayName(toolName)}
                    </h4>
                    <Switch
                      checked={tools[toolName]?.enabled || false}
                      onCheckedChange={(checked) => handleToolToggle(toolName, checked)}
                      className="scale-90"
                      disabled={disabled}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {toolInfo.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {getFilteredTools().length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-sm font-medium mb-1">Nenhuma ferramenta encontrada</h3>
            <p className="text-xs text-muted-foreground">Tente ajustar seus critérios de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}; 