'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Plus,
  Download,
  CheckCircle,
  Loader2,
  Globe,
  GlobeLock,
  GitBranch,
  Trash2,
  MoreVertical,
  User,
  ArrowRight,
  Plug,
  Zap,
  Workflow,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import { MiloLogo } from '@/components/sidebar/brand-logo';
import { AgentAvatar } from '@/components/thread/content/agent-avatar';
import { useComposioToolkitIcon } from '@/hooks/react-query/composio/use-composio';
import Image from 'next/image';

export type AgentCardVariant =
  | 'onboarding'
  | 'marketplace'
  | 'template'
  | 'agent'
  | 'showcase'
  | 'dashboard'
  | 'compact';

export interface BaseAgentData {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_at?: string;
  icon?: string;
  role?: string;
  capabilities?: string[];
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
  creator_id?: string;
  creator_name?: string;
  is_kortix_team?: boolean;
  download_count?: number;
  marketplace_published_at?: string;
  template_id?: string;
  is_public?: boolean;
  agent_id?: string;
  is_default?: boolean;
  current_version?: {
    version_id: string;
    version_name: string;
    version_number: number;
  };
  metadata?: {
    is_suna_default?: boolean;
    centrally_managed?: boolean;
    restrictions?: Record<string, boolean>;
  };
  mcp_requirements?: Array<{
    qualified_name: string;
    display_name: string;
    custom_type?: string;
    toolkit_slug?: string;
    source?: string;
  }>;
  agentpress_tools?: Record<string, any>;
}

export interface AgentCardActions {
  onPrimaryAction?: (data: BaseAgentData, e?: React.MouseEvent) => void;
  onSecondaryAction?: (data: BaseAgentData, e?: React.MouseEvent) => void;
  onDeleteAction?: (data: BaseAgentData, e?: React.MouseEvent) => void;
  onClick?: (data: BaseAgentData) => void;
  onToggle?: (agentId: string) => void;
  onOpenTriggers?: (data: BaseAgentData, e?: React.MouseEvent) => void;
  onOpenWorkflows?: (data: BaseAgentData, e?: React.MouseEvent) => void;
}

export interface AgentCardState {
  isSelected?: boolean;
  isRecommended?: boolean;
  isActioning?: boolean;
  isDeleting?: boolean;
}

export interface UnifiedAgentCardProps {
  variant: AgentCardVariant;
  data: BaseAgentData;
  actions?: AgentCardActions;
  state?: AgentCardState;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  currentUserId?: string;
}

const CardAvatar: React.FC<{
  data: BaseAgentData;
  size?: number;
  variant: AgentCardVariant;
}> = ({ data, size = 48, variant }) => {
  const isProphetDefaultAgent = data.metadata?.is_suna_default === true;

  if (variant === 'showcase') {
    return (
      <motion.div
        className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300"
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {data.icon}
      </motion.div>
    );
  }

  if (isProphetDefaultAgent) {
    return <AgentAvatar isProphetDefault={true} size={size} className="border" />;
  }

  if (data.icon_name) {
    return (
      <AgentAvatar
        iconName={data.icon_name}
        iconColor={data.icon_color}
        backgroundColor={data.icon_background}
        agentName={data.name}
        size={size}
      />
    );
  }

  return <AgentAvatar agentName={data.name} size={size} className="border" />;
};

const MarketplaceBadge: React.FC<{
  isMiloTeam?: boolean;
  isOwner?: boolean;
}> = ({ isMiloTeam, isOwner }) => (
  <div className="flex gap-1 flex-wrap">
    {isMiloTeam && (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 dark:bg-blue-950 dark:text-blue-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Milo
      </Badge>
    )}
    {isOwner && (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 dark:bg-green-950 dark:text-green-300">
        Owner
      </Badge>
    )}
  </div>
);

const TemplateBadge: React.FC<{ isPublic?: boolean }> = ({ isPublic }) => {
  if (isPublic) {
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-950 dark:text-emerald-300">
        <Globe className="h-3 w-3 mr-1" />
        Public
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
      <GlobeLock className="h-3 w-3 mr-1" />
      Private
    </Badge>
  );
};

const DownloadStats: React.FC<{ count?: number }> = ({ count = 0 }) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Download className="h-3 w-3" />
    {count} downloads
  </div>
);

const IntegrationsList: React.FC<{ data: BaseAgentData }> = ({ data }) => {
  const { data: toolkitIconResult } = useComposioToolkitIcon(
    data.mcp_requirements?.[0]?.toolkit_slug || '',
    { enabled: !!data.mcp_requirements?.[0]?.toolkit_slug },
  );
  const toolkitIcon = toolkitIconResult?.icon_url;

  if (!data.mcp_requirements || data.mcp_requirements.length === 0) {
    return <span className="text-xs text-muted-foreground italic">Nenhuma integração necessária</span>;
  }

  const firstRequirement = data.mcp_requirements[0];
  const remaining = data.mcp_requirements.length - 1;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        {toolkitIcon ? (
          <Image
            src={toolkitIcon}
            alt={firstRequirement.display_name}
            width={16}
            height={16}
            className="h-4 w-4 rounded-sm border object-cover"
            unoptimized
          />
        ) : (
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border">
            <Plug className="h-3 w-3" />
          </span>
        )}
        <span>{firstRequirement.display_name || firstRequirement.qualified_name}</span>
      </div>
      {remaining > 0 && <span className="text-xs text-muted-foreground/80">+{remaining}</span>}
    </div>
  );
};

const ShowcaseCard: React.FC<UnifiedAgentCardProps> = ({ data, actions, state, delay = 0 }) => (
  <motion.div
    className={cn(
      'group relative flex h-full flex-col items-center justify-between rounded-3xl border border-border bg-card/60 p-8 text-center shadow-sm backdrop-blur transition-all hover:shadow-lg',
      state?.isSelected && 'border-primary/80 shadow-primary/10',
    )}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: 'easeOut' }}
  >
    {state?.isRecommended && (
      <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
        Recomendado
      </span>
    )}
    <CardAvatar data={data} variant="showcase" size={72} />
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{data.name}</h3>
      {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}
    </div>
    <Button className="mt-4 gap-2" size="sm" onClick={(e) => actions?.onPrimaryAction?.(data, e)}>
      <ArrowRight className="h-4 w-4" />
      Experimentar
    </Button>
  </motion.div>
);

const DashboardCard: React.FC<UnifiedAgentCardProps> = ({ data, actions, state }) => (
  <Card
    className={cn(
      'relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/80 transition-all hover:border-border hover:shadow-md',
      state?.isSelected && 'border-primary shadow-primary/10',
    )}
    onClick={() => actions?.onClick?.(data)}
  >
    <CardContent className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <CardAvatar data={data} variant="dashboard" size={48} />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold leading-tight">{data.name}</h3>
            {data.metadata?.is_suna_default && (
              <Badge variant="secondary" className="gap-1 text-[0.65rem]">
                <MiloLogo size={12} />
                Default
              </Badge>
            )}
          </div>
          {data.description && <p className="line-clamp-2 text-sm text-muted-foreground">{data.description}</p>}
        </div>
      </div>
      {data.capabilities && data.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.capabilities.map((capability) => (
            <Badge key={capability} variant="outline" className="rounded-full border-dashed text-xs">
              {capability}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-border/60 pt-4 text-xs text-muted-foreground">
        <span>{data.role || 'Assistente Personalizado'}</span>
        <Button variant="ghost" size="sm" className="h-7 gap-2" onClick={(e) => actions?.onPrimaryAction?.(data, e)}>
          Configurar
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

const MarketplaceCard: React.FC<UnifiedAgentCardProps> = ({ data, actions, state, currentUserId }) => {
  const isOwner = data.creator_id && currentUserId && data.creator_id === currentUserId;

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-card/80 transition-all hover:-translate-y-1 hover:border-border hover:shadow-xl',
        state?.isSelected && 'border-primary/80 shadow-primary/20',
      )}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <CardAvatar data={data} variant="marketplace" size={52} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold leading-tight">{data.name}</h3>
                {data.creator_name && <p className="text-xs text-muted-foreground">por {data.creator_name}</p>}
              </div>
              <MarketplaceBadge isMiloTeam={data.is_kortix_team} isOwner={isOwner} />
            </div>
            {data.description && <p className="line-clamp-3 text-sm text-muted-foreground">{data.description}</p>}
          </div>
        </div>
        {data.mcp_requirements && data.mcp_requirements.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Integrações</p>
            <IntegrationsList data={data} />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <DownloadStats count={data.download_count} />
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full border-dashed text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/80 bg-card/60 px-6 py-4">
        <Button
          className="gap-2"
          size="sm"
          onClick={(e) => actions?.onPrimaryAction?.(data, e)}
          disabled={state?.isActioning}
        >
          {state?.isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Instalar
        </Button>
        <button
          onClick={() => actions?.onClick?.(data)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Ver detalhes
        </button>
      </div>
    </Card>
  );
};

const TemplateCard: React.FC<UnifiedAgentCardProps> = ({ data, actions, state }) => (
  <Card
    className={cn(
      'group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card/80 transition-all hover:-translate-y-1 hover:border-border hover:shadow-lg',
      state?.isSelected && 'border-primary/80 shadow-primary/20',
    )}
  >
    <div className="p-6 space-y-5">
      <div className="flex items-start gap-4">
        <CardAvatar data={data} variant='template' size={48} />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold leading-tight">{data.name}</h3>
            <TemplateBadge isPublic={data.is_public} />
          </div>
          {data.description && <p className="line-clamp-2 text-sm text-muted-foreground">{data.description}</p>}
        </div>
      </div>
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-full border-dashed text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>

    <div className="border-t border-border/80 bg-muted/40 px-6 py-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <DownloadStats count={data.download_count} />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={(e) => actions?.onSecondaryAction?.(data, e)}
            disabled={!data.is_public}
          >
            Ver no marketplace
          </Button>
          <Button
            variant={data.is_public ? 'outline' : 'default'}
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={(e) => actions?.onPrimaryAction?.(data, e)}
            disabled={state?.isActioning}
          >
            {state?.isActioning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : data.is_public ? (
              <>
                <GlobeLock className="h-4 w-4 mr-2" />
                Tornar privado
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  </Card>
);

const AgentCardComponent: React.FC<UnifiedAgentCardProps> = ({ data, actions, state }) => (
  <Card
    className={cn(
      'group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card/80 transition-all hover:-translate-y-1 hover:border-border hover:shadow-xl',
      state?.isSelected && 'border-primary/80 shadow-primary/20',
    )}
    onClick={() => actions?.onClick?.(data)}
  >
    <div className="p-6 space-y-4">
      <div className="flex items-start gap-4">
        <CardAvatar data={data} variant="agent" size={48} />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold leading-tight">{data.name}</h3>
            {data.metadata?.is_suna_default && (
              <Badge variant="secondary" className="gap-1 text-[0.65rem]">
                <MiloLogo size={12} />
                Default
              </Badge>
            )}
            {data.is_default && (
              <Badge variant="outline" className="gap-1 text-[0.65rem]">
                <Check className="h-3 w-3" />
                Padrão
              </Badge>
            )}
          </div>
          {data.description && <p className="line-clamp-2 text-sm text-muted-foreground">{data.description}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => actions?.onPrimaryAction?.(data, e)}>Configurar</DropdownMenuItem>
            {actions?.onOpenTriggers && (
              <DropdownMenuItem onClick={(e) => actions.onOpenTriggers?.(data, e)}>
                <Zap className="h-3.5 w-3.5 mr-2" /> Gatilhos
              </DropdownMenuItem>
            )}
            {actions?.onOpenWorkflows && (
              <DropdownMenuItem onClick={(e) => actions.onOpenWorkflows?.(data, e)}>
                <Workflow className="h-3.5 w-3.5 mr-2" /> Fluxos de trabalho
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => actions?.onSecondaryAction?.(data, e)} disabled={!data.is_public}>
              Ver no marketplace
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => actions?.onDeleteAction?.(data, e)}
              className={cn('text-red-600', !actions?.onDeleteAction && 'opacity-50 pointer-events-none')}
              disabled={!actions?.onDeleteAction}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {data.current_version && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <GitBranch className="h-3 w-3" />
          Versão {data.current_version.version_name ?? data.current_version.version_number}
        </div>
      )}
      {data.mcp_requirements && data.mcp_requirements.length > 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Integrações</p>
          <IntegrationsList data={data} />
        </div>
      )}
    </div>
    <div className="border-t border-border/80 bg-muted/40 px-6 py-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {data.agentpress_tools ? Object.keys(data.agentpress_tools).length : 0} ferramentas
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
          onClick={(e) => actions?.onPrimaryAction?.(data, e)}
        >
          Configurar
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  </Card>
);

const CompactCard: React.FC<UnifiedAgentCardProps> = ({ data, actions, state }) => (
  <button
    type="button"
    className={cn(
      'group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-left transition-all hover:border-border hover:bg-card',
      state?.isSelected && 'border-primary/70 bg-primary/5',
    )}
    onClick={() => actions?.onClick?.(data)}
  >
    <CardAvatar data={data} variant="compact" size={36} />
    <div className="flex-1">
      <p className="text-sm font-medium">{data.name}</p>
      {data.description && <p className="line-clamp-1 text-xs text-muted-foreground">{data.description}</p>}
    </div>
    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
  </button>
);

export const UnifiedAgentCard: React.FC<UnifiedAgentCardProps> = (props) => {
  const { variant } = props;

  switch (variant) {
    case 'showcase':
      return <ShowcaseCard {...props} />;
    case 'dashboard':
    case 'compact':
      return <DashboardCard {...props} />;
    case 'marketplace':
      return <MarketplaceCard {...props} />;
    case 'template':
      return <TemplateCard {...props} />;
    case 'agent':
      return <AgentCardComponent {...props} />;
    default:
      return <CompactCard {...props} />;
  }
};

export const AgentCard = UnifiedAgentCard;
export default UnifiedAgentCard;
