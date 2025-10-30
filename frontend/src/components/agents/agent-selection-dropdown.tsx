"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AgentAvatar } from '@/components/thread/content/agent-avatar';
import { Plus } from 'lucide-react';
import { NewAgentDialog } from './new-agent-dialog';
import type { Agent } from '@/hooks/react-query/agents/utils';

interface AgentSelectionDropdownProps {
  selectedAgentId?: string;
  onAgentSelect: (agentId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showCreateOption?: boolean;
  agents?: Agent[];
  isLoading?: boolean;
}

export const AgentSelectionDropdown: React.FC<AgentSelectionDropdownProps> = ({
  selectedAgentId,
  onAgentSelect,
  placeholder = 'Selecione um agente',
  className,
  disabled,
  showCreateOption = false,
  agents = [],
  isLoading = false,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const selectedAgent = agents.find((agent) => agent.agent_id === selectedAgentId);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Select
          value={selectedAgentId}
          onValueChange={onAgentSelect}
          disabled={disabled || isLoading || agents.length === 0}
        >
          <SelectTrigger className="w-full justify-start">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : selectedAgent ? (
              <div className="flex items-center gap-3">
                <AgentAvatar
                  agentId={selectedAgent.agent_id}
                  size={24}
                  fallbackName={selectedAgent.name}
                />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">
                    {selectedAgent.name}
                  </span>
                  {selectedAgent.description && (
                    <span className="text-xs text-muted-foreground">
                      {selectedAgent.description}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {agents.map((agent) => (
              <SelectItem key={agent.agent_id} value={agent.agent_id}>
                <div className="flex items-center gap-3">
                  <AgentAvatar
                    agentId={agent.agent_id}
                    size={20}
                    fallbackName={agent.name}
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground">
                      {agent.name}
                    </span>
                    {agent.description && (
                      <span className="text-xs text-muted-foreground">
                        {agent.description}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
            {!isLoading && agents.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                Nenhum agente encontrado.
              </div>
            )}
          </SelectContent>
        </Select>

        {showCreateOption && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => setCreateDialogOpen(true)}
            title="Criar novo agente"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <NewAgentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={(agentId) => {
          onAgentSelect(agentId);
        }}
      />
    </div>
  );
};

