import React from 'react';
import { AgentBuilderChat } from '../agent-builder-chat';

interface AgentBuilderTabProps {
  agentId: string;
  displayData: {
    name: string;
    description: string;
    system_prompt: string;
    agentpress_tools: any;
    configured_mcps: any[];
    custom_mcps: any[];
    is_default: boolean;
    avatar: string;
    avatar_color: string;
  };
  currentStyle: {
    avatar: string;
    color: string;
  };
  isViewingOldVersion: boolean;
  onFieldChange: (field: string, value: any) => void;
  onStyleChange: (emoji: string, color: string) => void;
}

export function AgentBuilderTab({
  agentId,
  displayData,
  currentStyle,
  isViewingOldVersion,
  onFieldChange,
  onStyleChange,
}: AgentBuilderTabProps) {
  if (isViewingOldVersion) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3 max-w-md px-6">
          <div className="text-4xl opacity-50">🔒</div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">Construtor Indisponível</h3>
            <p className="text-sm text-muted-foreground">
              Disponível apenas para a versão atual. Por favor, ative esta versão primeiro.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <AgentBuilderChat 
        agentId={agentId}
        formData={displayData}
        handleFieldChange={onFieldChange}
        handleStyleChange={onStyleChange}
        currentStyle={currentStyle}
      />
    </div>
  );
} 