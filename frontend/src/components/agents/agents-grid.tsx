import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { getAgentAvatar } from '../../lib/utils/get-agent-style';
import { AgentCard } from './custom-agents-page/agent-card';
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
  const router = useRouter();
  const { t } = usePtTranslations();

  const handleCustomize = (agentId: string) => {
    router.push(`/agents/config/${agentId}`);
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
          const agentData = {
            ...agent,
            id: agent.agent_id,
            // Adiciona mcp_requirements se não existir mas configured_mcps existir
            mcp_requirements: agent.mcp_requirements || (agent.configured_mcps && agent.configured_mcps.length > 0 ? 
              agent.configured_mcps.map((mcp: any) => ({
                qualified_name: typeof mcp === 'string' ? mcp : (mcp.name || mcp.qualified_name),
                display_name: typeof mcp === 'string' ? mcp : (mcp.name || mcp.display_name),
                custom_type: typeof mcp === 'object' ? mcp.type : undefined
              })) : undefined)
          };
          
          return (
            <div key={agent.agent_id} className="relative group flex flex-col h-full">
              <AgentCard
                mode="agent"
                data={agentData}
                styling={getAgentStyling(agent)}
                onCustomize={handleCustomize}
                onPublish={handlePublish}
                isPublishing={externalPublishingId === agent.agent_id}
              />
              
              {/* Delete button overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {!agent.is_default && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-muted-foreground"
                        disabled={deleteAgentMutation.isPending}
                        title={t('agents.delete')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-3.5 w-3.5 opacity-60" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">{t('agents.deleteConfirmation.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('agents.deleteConfirmation.description')} &quot;{agent.name}&quot;? {t('agents.deleteConfirmation.warning')}
                          {agent.is_public && (
                            <span className="block mt-2 text-amber-600 dark:text-amber-400">
                              Note: This agent is currently published to the marketplace and will be removed from there as well.
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                          {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAgent(agent.agent_id);
                          }}
                          disabled={deleteAgentMutation.isPending}
                          className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                          {deleteAgentMutation.isPending ? t('thread.deleteConfirmation.deleting') : t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};