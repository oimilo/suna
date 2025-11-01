'use client';

import React from 'react';
import { Download, CheckCircle, Loader2, Globe, GlobeLock, GitBranch, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MarketplaceTemplate } from '@/components/agents/installation/types';
import { BrandLogo } from '@/components/sidebar/brand-logo';
import { BRANDING } from '@/lib/branding';

export type AgentCardMode = 'marketplace' | 'template' | 'agent';

interface BaseAgentData {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_at: string;
  avatar?: string;
  avatar_color?: string;
}

interface MarketplaceData extends BaseAgentData {
  is_kortix_team?: boolean;
  download_count: number;
  creator_name?: string;
  marketplace_published_at?: string;
  mcp_requirements?: Array<{
    qualified_name: string;
    display_name: string;
    custom_type?: string;
  }>;
}

interface TemplateData extends BaseAgentData {
  template_id: string;
  is_public?: boolean;
  download_count?: number;
}

interface AgentData extends BaseAgentData {
  agent_id: string;
  is_default?: boolean;
  is_public?: boolean;
  marketplace_published_at?: string;
  download_count?: number;
  configured_mcps?: Array<{ name: string }>;
  custom_mcps?: Array<{ name: string }>;
  mcp_requirements?: Array<{
    qualified_name: string;
    display_name: string;
    custom_type?: string;
  }>;
  agentpress_tools?: Record<string, any>;
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

type AgentCardData = MarketplaceData | TemplateData | AgentData;

interface AgentCardProps {
  mode: AgentCardMode;
  data: AgentCardData;
  styling: {
    avatar: string;
    color: string;
  };
  isActioning?: boolean;
  onPrimaryAction?: (data: any, e?: React.MouseEvent) => void;
  onSecondaryAction?: (data: any, e?: React.MouseEvent) => void;
  onClick?: (data: any) => void;
  onCustomize?: (agentId: string) => void;
  onPublish?: (agent: any) => void;
  isPublishing?: boolean;
}

const MarketplaceBadge: React.FC<{ isMiloTeam?: boolean }> = ({ isMiloTeam }) => {
  if (isMiloTeam) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 text-xs font-medium">
        <CheckCircle className="h-3 w-3 opacity-60" />
        {BRANDING.company}
      </span>
    );
  }
  return null;
};

const TemplateBadge: React.FC<{ isPublic?: boolean }> = ({ isPublic }) => {
  if (isPublic) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 text-xs font-medium">
        <Globe className="h-3 w-3 opacity-60" />
        Public
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 text-xs font-medium text-muted-foreground">
      <GlobeLock className="h-3 w-3 opacity-60" />
      Private
    </span>
  );
};

const AgentBadges: React.FC<{ agent: AgentData, isSunaAgent: boolean }> = ({ agent, isSunaAgent }) => (
  <div className="flex gap-1.5">
    {!isSunaAgent && agent.current_version && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 text-xs">
        <GitBranch className="h-3 w-3 opacity-60" />
        {agent.current_version.version_name}
      </span>
    )}
    {!isSunaAgent && agent.is_public && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 text-xs font-medium">
        <Globe className="h-3 w-3 opacity-60" />
        Published
      </span>
    )}
  </div>
);


const MarketplaceMetadata: React.FC<{ data: MarketplaceData }> = ({ data }) => {
  const mcpCount = data.mcp_requirements?.length || 0;
  
  // Processa os MCPs para exibição limpa
  const mcpNames = data.mcp_requirements?.slice(0, 2).map(mcp => {
    const name = mcp.display_name || mcp.qualified_name || '';
    // Remove prefixos e formata
    return name
      .replace('mcp_', '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }) || [];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1">
          <Download className="h-3 w-3 opacity-60" />
          <span>{data.download_count} {data.download_count === 1 ? 'instalação' : 'instalações'}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <Plug className="h-3 w-3 opacity-60" />
        {mcpCount > 0 ? (
          <span className="font-medium text-foreground/80">
            {mcpNames.join(', ')}
            {mcpCount > 2 && ` +${mcpCount - 2}`}
          </span>
        ) : (
          <span className="italic">Nenhuma integração necessária</span>
        )}
      </div>
    </div>
  );
};

const TemplateMetadata: React.FC<{ data: TemplateData }> = ({ data }) => {
  if (!data.is_public || !data.download_count) return null;
  
  return (
    <div className="flex items-center text-xs text-muted-foreground/60">
      <Download className="h-3 w-3 mr-1 opacity-60" />
      <span>{data.download_count} downloads</span>
    </div>
  );
};

const AgentMetadata: React.FC<{ data: AgentData }> = ({ data }) => {
  // Detecta integrações de várias fontes
  let integrations: string[] = [];
  
  // 1. Verifica mcp_requirements (marketplace)
  if (data.mcp_requirements && data.mcp_requirements.length > 0) {
    integrations = data.mcp_requirements.map(mcp => {
      const name = mcp.display_name || mcp.qualified_name || '';
      return name
        .replace('mcp_', '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    });
  }
  
  // 2. Verifica configured_mcps
  else if (data.configured_mcps && data.configured_mcps.length > 0) {
    integrations = data.configured_mcps.map(mcp => {
      const name = mcp.name || '';
      return name
        .replace('mcp_', '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    });
  }
  
  // 3. Detecta integrações derivadas das ferramentas legadas do agentpress
  else if (data.agentpress_tools && Object.keys(data.agentpress_tools).length > 0) {
    const toolKeys = Object.keys(data.agentpress_tools);
    const integrationSet = new Set<string>();
    
    toolKeys.forEach(key => {
      // Extrai o nome da integração do nome da ferramenta
      // Ex: google_calendar_create_event -> Google Calendar
      if (key.includes('google_calendar')) {
        integrationSet.add('Google Calendar');
      } else if (key.includes('gmail')) {
        integrationSet.add('Gmail');
      } else if (key.includes('slack')) {
        integrationSet.add('Slack');
      } else if (key.includes('notion')) {
        integrationSet.add('Notion');
      } else if (key.includes('github')) {
        integrationSet.add('GitHub');
      } else if (key.includes('discord')) {
        integrationSet.add('Discord');
      } else if (key.includes('telegram')) {
        integrationSet.add('Telegram');
      } else if (key.includes('whatsapp')) {
        integrationSet.add('WhatsApp');
      }
      // Adicione mais conforme necessário
    });
    
    integrations = Array.from(integrationSet);
  }
  
  // 4. Verifica custom_mcps também
  if (integrations.length === 0 && data.custom_mcps && data.custom_mcps.length > 0) {
    integrations = data.custom_mcps.map(mcp => {
      const name = mcp.name || '';
      return name
        .replace('mcp_', '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    });
  }
  
  const displayIntegrations = integrations.slice(0, 2);
  const totalCount = integrations.length;
  
  return (
    <div className="space-y-1.5">
      {data.is_public && data.download_count && (
        <div className="flex items-center text-xs text-muted-foreground/60">
          <Download className="h-3 w-3 mr-1 opacity-60" />
          <span>{data.download_count} downloads</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <Plug className="h-3 w-3 opacity-60" />
        {totalCount > 0 ? (
          <span className="font-medium text-foreground/80">
            {displayIntegrations.join(', ')}
            {totalCount > 2 && ` +${totalCount - 2}`}
          </span>
        ) : (
          <span className="italic">Nenhuma integração configurada</span>
        )}
      </div>
    </div>
  );
};

const MarketplaceActions: React.FC<{ 
  onAction?: (data: any, e?: React.MouseEvent) => void;
  isActioning?: boolean;
  data: any;
}> = ({ onAction, isActioning, data }) => (
  <Button 
    onClick={(e) => onAction?.(data, e)}
    disabled={isActioning}
    className="w-full h-8 bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black rounded-md transition-all duration-200"
    size="sm"
  >
    {isActioning ? (
      <>
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 opacity-80" />
        <span className="text-xs font-medium">Instalando...</span>
      </>
    ) : (
      <>
        <Download className="h-3.5 w-3.5 mr-1.5 opacity-80" />
        <span className="text-xs font-medium">Instalar Agente</span>
      </>
    )}
  </Button>
);

const TemplateActions: React.FC<{ 
  data: TemplateData;
  onPrimaryAction?: (data: any, e?: React.MouseEvent) => void;
  onSecondaryAction?: (data: any, e?: React.MouseEvent) => void;
  isActioning?: boolean;
}> = ({ data, onPrimaryAction, onSecondaryAction, isActioning }) => (
  <div className="space-y-2">
    {data.is_public ? (
      <>
        <Button
          onClick={(e) => onPrimaryAction?.(data, e)}
          disabled={isActioning}
          variant="outline"
          className="w-full h-8 border-black/10 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          size="sm"
        >
          {isActioning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60 mr-1.5" />
              <span className="text-xs">Despublicando...</span>
            </>
          ) : (
            <>
              <GlobeLock className="h-3.5 w-3.5 opacity-60 mr-1.5" />
              <span className="text-xs">Tornar Privado</span>
            </>
          )}
        </Button>
      </>
    ) : (
      <Button
        onClick={(e) => onPrimaryAction?.(data, e)}
        disabled={isActioning}
        className="w-full h-8 bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black"
        size="sm"
      >
        {isActioning ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin opacity-80 mr-1.5" />
            <span className="text-xs">Publicando...</span>
          </>
        ) : (
          <>
            <Globe className="h-3.5 w-3.5 opacity-80 mr-1.5" />
            <span className="text-xs">Publicar no Marketplace</span>
          </>
        )}
      </Button>
    )}
  </div>
);

const CardAvatar: React.FC<{ avatar: string; color: string; isSunaAgent?: boolean }> = ({ avatar, color, isSunaAgent = false }) => {
  if (isSunaAgent) {
    return (
      <div className="h-10 w-10 bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 flex items-center justify-center rounded-lg">
        <BrandLogo size={20} />
      </div>
    )
  }
  return (
    <div 
      className="relative h-10 w-10 flex items-center justify-center rounded-lg bg-black/[0.06] dark:bg-white/[0.06] border border-black/6 dark:border-white/8" 
    >
      <div className="text-lg opacity-80">{avatar}</div>
    </div>
  )
};

const TagList: React.FC<{ tags?: string[] }> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 2).map(tag => (
        <span key={tag} className="text-xs text-muted-foreground/60 font-mono">
          #{tag}
        </span>
      ))}
      {tags.length > 2 && (
        <span className="text-xs text-muted-foreground/60">
          +{tags.length - 2}
        </span>
      )}
    </div>
  );
};

export const AgentCard: React.FC<AgentCardProps> = ({
  mode,
  data,
  styling,
  isActioning = false,
  onPrimaryAction,
  onSecondaryAction,
  onClick,
  onCustomize,
  onPublish,
  isPublishing = false
}) => {
  const { avatar, color } = styling;
  
  const isSunaAgent = mode === 'agent' && (data as AgentData).metadata?.is_suna_default === true;
  
  const isAgentClickable = mode === 'agent' && onCustomize;
  const cardClassName = `group relative bg-black/[0.02] dark:bg-white/[0.03] rounded-lg overflow-hidden transition-all duration-200 border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:border-black/8 dark:hover:border-white/10 ${isAgentClickable ? 'cursor-pointer' : ''} flex flex-col min-h-[220px]`;
  
  const renderBadge = () => {
    switch (mode) {
      case 'marketplace':
        return <MarketplaceBadge isMiloTeam={(data as MarketplaceData).is_kortix_team} />;
      case 'template':
        return <TemplateBadge isPublic={(data as TemplateData).is_public} />;
      case 'agent':
        return <AgentBadges agent={data as AgentData} isSunaAgent={isSunaAgent} />;
      default:
        return null;
    }
  };

  const renderMetadata = () => {
    switch (mode) {
      case 'marketplace':
        return <MarketplaceMetadata data={data as MarketplaceData} />;
      case 'template':
        return <TemplateMetadata data={data as TemplateData} />;
      case 'agent':
        return <AgentMetadata data={data as AgentData} />;
      default:
        return null;
    }
  };

  const renderActions = () => {
    switch (mode) {
      case 'marketplace':
        return <MarketplaceActions onAction={onPrimaryAction} isActioning={isActioning} data={data} />;
      case 'template':
        return <TemplateActions 
          data={data as TemplateData} 
          onPrimaryAction={onPrimaryAction} 
          onSecondaryAction={onSecondaryAction} 
          isActioning={isActioning} 
        />;
      case 'agent':
        const agentData = data as AgentData;
        const isSuna = agentData.metadata?.is_suna_default;
        const isDefaultAgent = agentData.is_default;
        
        // Mostra botão desabilitado para agentes padrão do sistema
        if (isDefaultAgent || isSuna) {
          return (
            <div className="relative group/button">
              <Button
                disabled
                variant="outline"
                className="w-full h-8 border-black/10 dark:border-white/10 opacity-50 cursor-not-allowed"
                size="sm"
              >
                <Globe className="h-3.5 w-3.5 opacity-40 mr-1.5" />
                <span className="text-xs opacity-60">Publicar</span>
              </Button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 dark:bg-white/90 text-white dark:text-black text-xs rounded opacity-0 group-hover/button:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Agente padrão do sistema não pode ser publicado
              </div>
            </div>
          );
        }
        
        // Mostra botão normal para outros agentes
        const showPublish = !isSuna && onPublish && !agentData.is_public;
        
        if (showPublish) {
          return (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPublish(agentData);
              }}
              disabled={isPublishing}
              variant="outline"
              className="w-full h-8 border-black/10 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
              size="sm"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60 mr-1.5" />
                  <span className="text-xs">Publicando...</span>
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5 opacity-60 mr-1.5" />
                  <span className="text-xs">Publicar</span>
                </>
              )}
            </Button>
          );
        }
        
        return null;
      default:
        return null;
    }
  };

  const handleCardClick = () => {
    if (mode === 'agent' && onCustomize) {
      const agentData = data as AgentData;
      onCustomize(agentData.agent_id);
    } else if (mode !== 'agent' && onClick) {
      onClick(data);
    }
  };

  return (
    <div className={cardClassName} onClick={handleCardClick}>
      <div className="p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <CardAvatar avatar={avatar} color={color} isSunaAgent={isSunaAgent} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold tracking-tight truncate">
                {data.name}
              </h3>
              {mode === 'agent' && (data as AgentData).current_version && (
                <span className="text-xs text-muted-foreground/60 font-mono">
                  v{(data as AgentData).current_version?.version_number}
                </span>
              )}
            </div>
            {renderBadge()}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-xs text-muted-foreground/80 leading-relaxed mb-3 line-clamp-2 min-h-[2rem]">
          {(() => {
            // Traduz descrição do Prophet
            if (data.name === 'Prophet' && data.description) {
              if (data.description.includes('Prophet is your AI assistant')) {
                return 'Prophet é seu assistente IA com acesso a várias ferramentas e integrações para ajudá-lo com tarefas em diferentes domínios.';
              }
            }
            return data.description || 'Sem descrição disponível';
          })()}
        </p>
        
        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="mb-3">
            <TagList tags={data.tags} />
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-black/4 dark:border-white/6">
          {renderMetadata()}
          {renderActions() && (
            <div className="mt-2">
              {renderActions()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
