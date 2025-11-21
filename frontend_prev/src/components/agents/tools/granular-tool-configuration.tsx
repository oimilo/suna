'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronRight, Settings2, Wrench, Loader2 } from 'lucide-react';
import { icons } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useToolsMetadata } from '@/hooks/tools/use-tools-metadata';
import {
  getToolGroup,
  hasGranularControl,
  validateToolConfig,
  getAllToolGroups,
  sortToolsByWeight,
  type ToolGroup,
  type ToolMethod,
} from './tool-groups';
import { BRANDING } from '@/lib/branding';

interface GranularToolConfigurationProps {
  tools: Record<string, any>;
  onToolsChange: (tools: Record<string, any>) => void;
  disabled?: boolean;
  isProphetAgent?: boolean;
  isLoading?: boolean;
}

export const GranularToolConfiguration = ({
  tools,
  onToolsChange,
  disabled = false,
  isProphetAgent = false,
  isLoading = false,
}: GranularToolConfigurationProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: toolsMetadata, isLoading: isLoadingTools } = useToolsMetadata();
  const toolsData = toolsMetadata?.success ? toolsMetadata.tools : undefined;
  const TOOL_GROUPS = getAllToolGroups(toolsData);

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Wrench;
    const IconComponent = (icons as any)[iconName];
    return IconComponent || Wrench;
  };

  const isToolGroupEnabled = (toolName: string): boolean => {
    const toolConfig = tools[toolName];
    if (toolConfig === undefined) return false;
    if (typeof toolConfig === 'boolean') return toolConfig;
    if (typeof toolConfig === 'object' && toolConfig !== null) {
      return toolConfig.enabled ?? true;
    }
    return false;
  };

  const isMethodEnabled = (toolName: string, methodName: string): boolean => {
    const toolConfig = tools[toolName];
    if (!isToolGroupEnabled(toolName)) return false;

    if (typeof toolConfig === 'boolean') return toolConfig;
    if (typeof toolConfig === 'object' && toolConfig !== null) {
      const methodsConfig = toolConfig.methods || {};
      const methodConfig = methodsConfig[methodName];

      if (typeof methodConfig === 'boolean') return methodConfig;
      if (typeof methodConfig === 'object' && methodConfig !== null) {
        return methodConfig.enabled ?? true;
      }

      const toolGroup = getToolGroup(toolName, toolsData);
      const method = toolGroup?.methods.find((m) => m.name === methodName);
      return method?.enabled ?? true;
    }
    return false;
  };

  const handleToolGroupToggle = (toolName: string, enabled: boolean) => {
    const toolGroup = getToolGroup(toolName, toolsData);

    if (disabled && isProphetAgent) {
      toast.error('Tools cannot be modified', {
        description: `${BRANDING.defaultAgentName}'s default tools are managed centrally and cannot be changed.`,
      });
      return;
    }

    if (isLoading) return;

    const updatedTools = { ...tools };

    if (hasGranularControl(toolName, toolsData)) {
      const currentConfig = tools[toolName];
      if (typeof currentConfig === 'object' && currentConfig !== null) {
        updatedTools[toolName] = {
          ...currentConfig,
          enabled,
        };
      } else {
        const group = getToolGroup(toolName, toolsData);
        updatedTools[toolName] = {
          enabled,
          methods:
            group?.methods.reduce((acc, method) => {
              acc[method.name] = method.enabled;
              return acc;
            }, {} as Record<string, boolean>) || {},
        };
      }
    } else {
      updatedTools[toolName] = enabled;
    }

    onToolsChange(validateToolConfig(updatedTools, toolsData));
  };

  const handleMethodToggle = (toolName: string, methodName: string, enabled: boolean) => {
    const toolGroup = getToolGroup(toolName, toolsData);
    const method = toolGroup?.methods.find((m) => m.name === methodName);

    if (disabled && isProphetAgent) {
      toast.error('Methods cannot be modified', {
        description: `${BRANDING.defaultAgentName}'s default tool methods are managed centrally and cannot be changed.`,
      });
      return;
    }

    if (isLoading) return;

    const updatedTools = { ...tools };
    const currentConfig = tools[toolName];

    if (typeof currentConfig === 'object' && currentConfig !== null) {
      updatedTools[toolName] = {
        ...currentConfig,
        methods: {
          ...currentConfig.methods,
          [methodName]: enabled,
        },
      };
    } else {
      updatedTools[toolName] = {
        enabled: isToolGroupEnabled(toolName),
        methods: {
          ...toolGroup?.methods.reduce((acc, method) => {
            acc[method.name] = method.name === methodName ? enabled : method.enabled;
            return acc;
          }, {} as Record<string, boolean>) || {},
        },
      };
    }

    onToolsChange(validateToolConfig(updatedTools, toolsData));
  };

  const toggleGroupExpansion = (toolName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(toolName)) {
      newExpanded.delete(toolName);
    } else {
      newExpanded.add(toolName);
    }
    setExpandedGroups(newExpanded);
  };

  const filterToolGroup = (group: ToolGroup, query: string) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      group.displayName?.toLowerCase().includes(q) ||
      group.description?.toLowerCase().includes(q) ||
      group.methods.some(
        (method) =>
          method.displayName?.toLowerCase().includes(q) || method.description?.toLowerCase().includes(q),
      )
    );
  };

  const getFilteredToolGroups = (): ToolGroup[] => {
    const sortedTools = sortToolsByWeight(TOOL_GROUPS);
    const visibleTools = sortedTools.filter((group) => group.visible !== false);
    return visibleTools.filter((group) => filterToolGroup(group, searchQuery));
  };

  const getEnabledToolsCount = (): number => {
    return Object.entries(tools).filter(([toolName]) => isToolGroupEnabled(toolName)).length;
  };

  const getEnabledMethodsCount = (toolName: string): number => {
    const toolGroup = getToolGroup(toolName, toolsData);
    if (!toolGroup) return 0;
    return toolGroup.methods.filter((method) => method.visible !== false && isMethodEnabled(toolName, method.name)).length;
  };

  const filteredGroups = getFilteredToolGroups();

  if (isLoadingTools) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading tools...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="flex items-center justify-between flex-shrink-0 mb-4 w-full">
        <div>
          <h3 className="text-lg font-semibold">Tool Configuration</h3>
          <p className="text-sm text-muted-foreground">Configure tools and their individual capabilities for your agent</p>
        </div>
        <Badge variant="default" className="text-xs">
          {getEnabledToolsCount()} / {Object.keys(TOOL_GROUPS).length} tools enabled
        </Badge>
      </div>

      <div className="relative flex-shrink-0 mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search tools and capabilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex-1 overflow-auto pr-1 w-full min-w-0">
        <div className="space-y-2 pb-4 w-full">
          {filteredGroups.map((toolGroup) => {
            const isGroupEnabled = isToolGroupEnabled(toolGroup.name);
            const isExpanded = expandedGroups.has(toolGroup.name);
            const enabledMethodsCount = getEnabledMethodsCount(toolGroup.name);
            const totalMethodsCount = toolGroup.methods.filter((m) => m.visible !== false).length;
            const IconComponent = getIconComponent(toolGroup.icon);
            const hasGranular = hasGranularControl(toolGroup.name, toolsData);

            const visibleMethods = toolGroup.methods.filter((method) => method.visible !== false);
            const recommendedMethods = visibleMethods.filter((method) => method.isCore);
            const optionalMethods = visibleMethods.filter((method) => !method.isCore);

            return (
              <SpotlightCard key={toolGroup.name} className="bg-card border border-border w-full min-w-0 max-w-full overflow-hidden">
                <div className="p-5 w-full box-border" style={{ maxWidth: '100%' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border/50 flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground truncate">{toolGroup.displayName}</h4>
                          {toolGroup.isCore && <Badge variant="outline" className="text-xs">Core</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{toolGroup.description}</p>
                        {hasGranular && isGroupEnabled && (
                          <button
                            onClick={() => toggleGroupExpansion(toolGroup.name)}
                            className="flex items-center gap-1 mt-1 hover:opacity-80 transition-opacity"
                          >
                            <p className="text-xs text-muted-foreground">
                              {enabledMethodsCount} / {totalMethodsCount} capabilities enabled
                            </p>
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <Checkbox
                        checked={isGroupEnabled}
                        onCheckedChange={(enabled) => handleToolGroupToggle(toolGroup.name, enabled === true)}
                        disabled={disabled || isLoading}
                      />
                    </div>
                  </div>

                  {hasGranular && isGroupEnabled && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleGroupExpansion(toolGroup.name)}>
                      <CollapsibleContent className="w-full overflow-hidden">
                        <div className="mt-4 pt-4 border-t w-full space-y-4">
                          {recommendedMethods.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Settings2 className="h-4 w-4 text-primary" />
                                  <p className="text-sm font-medium text-foreground">Recommended capabilities</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {recommendedMethods.length} recommended
                                </Badge>
                              </div>
                              <div className="space-y-3">
                                {recommendedMethods.map((method) => (
                                  <MethodRow
                                    key={method.name}
                                    method={method}
                                    toolName={toolGroup.name}
                                    isEnabled={isMethodEnabled(toolGroup.name, method.name)}
                                    onToggle={handleMethodToggle}
                                    disabled={disabled || isLoading}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {optionalMethods.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Optional capabilities</p>
                              <div className="space-y-3">
                                {optionalMethods.map((method) => (
                                  <MethodRow
                                    key={method.name}
                                    method={method}
                                    toolName={toolGroup.name}
                                    isEnabled={isMethodEnabled(toolGroup.name, method.name)}
                                    onToggle={handleMethodToggle}
                                    disabled={disabled || isLoading}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface MethodRowProps {
  method: ToolMethod;
  toolName: string;
  isEnabled: boolean;
  onToggle: (toolName: string, methodName: string, enabled: boolean) => void;
  disabled?: boolean;
}

const MethodRow = ({ method, toolName, isEnabled, onToggle, disabled }: MethodRowProps) => (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-4 flex-1 min-w-0 ml-6">
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 w-full overflow-hidden">
          <h5 className="text-sm font-medium truncate">{method.displayName}</h5>
          {method.isCore && (
            <Badge variant="outline" className="text-xs flex-shrink-0">
              Core
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate w-full">{method.description}</p>
      </div>
    </div>

    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
      <Checkbox
        checked={isEnabled}
        onCheckedChange={(enabled) => onToggle(toolName, method.name, enabled === true)}
        disabled={disabled}
      />
    </div>
  </div>
);

