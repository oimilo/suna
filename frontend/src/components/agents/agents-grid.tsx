import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAgentAvatar } from '../../lib/utils/get-agent-style';
import { UnifiedAgentCard, type BaseAgentData } from '@/components/ui/unified-agent-card';
import { usePtTranslations } from '@/hooks/use-pt-translations';

interface Agent {
  agent_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_public?: boolean;
  marketplace_published_at?: string;
  download_count?: number;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  configured_mcps?: Array<{ name: string }>;
  mcp_requirements?: Array<{
    qualified_name: string;
    display_name: string;
    custom_type?: string;
  }>;
  agentpress_tools?: Record<string, any>;
  avatar?: string;
  avatar_color?: string;
  template_id?: string;
  current_version_id?: string;
  version_count?: number;
  current_version?: {
    version_id: string;
    version_name: string;
    version_number: number;
  };
  metadata?: {
    is_suna_default?: boolean;
    centrally_managed?: boolean;
    restrictions?: {
      system_prompt_editable?: boolean;
      tools_editable?: boolean;
      name_editable?: boolean;
      description_editable?: boolean;
      mcps_editable?: boolean;
    };
  };
}

interface AgentsGridProps {
  agents: Agent[];
  onEditAgent: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
  onToggleDefault: (agentId: string, currentDefault: boolean) => void;
  deleteAgentMutation: { isPending: boolean };
  onPublish?: (agent: Agent) => void;
  publishingId?: string | null;
}

export const AgentsGrid: React.FC<AgentsGridProps> = ({ 
  agents, 
  onEditAgent, 
  onDeleteAgent, 
  onToggleDefault,
  deleteAgentMutation,
  onPublish,
  publishingId: externalPublishingId
}) => {
  const { t } = usePtTranslations();
  const [agentPendingDeletion, setAgentPendingDeletion] = useState<Agent | null>(null);

  const handleCustomize = (agentId: string) => {
    onEditAgent(agentId);
  };

  const handlePublish = (agent: Agent) => {
    if (onPublish) {
      onPublish(agent);
    }
  };

  const getAgentStyling = (agent: Agent) => {
    if (agent.avatar && agent.avatar_color) {
      return {
        avatar: agent.avatar,
        color: agent.avatar_color,
      };
    }
    return getAgentAvatar(agent.agent_id);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => {
          // Converte configured_mcps para mcp_requirements se necessário
          const mcpRequirements =
            agent.mcp_requirements ||
            (agent.configured_mcps && agent.configured_mcps.length > 0
              ? agent.configured_mcps.map((mcp: any) => ({
                  qualified_name: typeof mcp === 'string' ? mcp : mcp.name || mcp.qualified_name,
                  display_name: typeof mcp === 'string' ? mcp : mcp.name || mcp.display_name,
                  custom_type: typeof mcp === 'object' ? mcp.type : undefined,
                }))
              : undefined);

          const styling = getAgentStyling(agent);
          const baseData: BaseAgentData = {
            id: agent.agent_id,
            name: agent.name,
            description: agent.description,
            tags: agent.tags,
            created_at: agent.created_at,
            agent_id: agent.agent_id,
            is_default: agent.is_default,
            is_public: agent.is_public,
            marketplace_published_at: agent.marketplace_published_at,
            download_count: agent.download_count,
            current_version: agent.current_version,
            metadata: agent.metadata,
            icon_name: agent.avatar ?? styling.avatar,
            icon_color: agent.avatar_color ?? undefined,
            icon_background: styling.color,
            mcp_requirements: mcpRequirements,
            agentpress_tools: agent.agentpress_tools,
          };

          return (
            <div key={agent.agent_id} className="relative flex flex-col h-full">
              <UnifiedAgentCard
                variant="agent"
                data={baseData}
                actions={{
                  onPrimaryAction: (data, e) => {
                    e?.stopPropagation();
                    handleCustomize(data.agent_id || agent.agent_id);
                  },
                  onClick: (data) => handleCustomize(data.agent_id || agent.agent_id),
                  onSecondaryAction: agent.is_public
                    ? undefined
                    : (data, e) => {
                        e?.stopPropagation();
                        handlePublish(agent);
                      },
                  onDeleteAction: agent.is_default
                    ? undefined
                    : (data, e) => {
                        e?.stopPropagation();
                        setAgentPendingDeletion(agent);
                      },
                }}
                state={{
                  isActioning: externalPublishingId === agent.agent_id,
                }}
              />
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!agentPendingDeletion} onOpenChange={(open) => !open && setAgentPendingDeletion(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t('agents.deleteConfirmation.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {agentPendingDeletion
                ? `${t('agents.deleteConfirmation.description')} "${agentPendingDeletion.name}"? ${t('agents.deleteConfirmation.warning')}`
                : t('agents.deleteConfirmation.description')}
              {agentPendingDeletion?.is_public && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  Note: This agent is currently published to the marketplace and will be removed from there as well.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAgentMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (agentPendingDeletion) {
                  onDeleteAgent(agentPendingDeletion.agent_id);
                }
                setAgentPendingDeletion(null);
              }}
              disabled={deleteAgentMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleteAgentMutation.isPending ? t('thread.deleteConfirmation.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
