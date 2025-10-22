'use client';

import React from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { cn } from '@/lib/utils';
import { KortixLogo } from '@/components/sidebar/brand-logo';
import { useAgentFromCache } from '@/hooks/react-query/agents/use-agents';
import type { Agent } from '@/hooks/react-query/agents/utils';

interface AgentAvatarProps {
  agent?: Agent;
  agentId?: string;
  fallbackName?: string;
  iconName?: string | null;
  iconColor?: string;
  backgroundColor?: string;
  agentName?: string;
  isSunaDefault?: boolean;
  size?: number;
  className?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agent: propAgent,
  agentId,
  fallbackName = 'Suna',
  iconName: propIconName,
  iconColor: propIconColor,
  backgroundColor: propBackgroundColor,
  agentName: propAgentName,
  isSunaDefault: propIsSunaDefault,
  size = 16,
  className = '',
}) => {
  const cachedAgent = useAgentFromCache(!propAgent && agentId ? agentId : undefined);
  const agent = propAgent || cachedAgent;

  const iconName = propIconName ?? agent?.icon_name;
  const iconColor = propIconColor ?? agent?.icon_color ?? '#000000';
  const backgroundColor = propBackgroundColor ?? agent?.icon_background ?? '#F3F4F6';
  const agentName = propAgentName ?? agent?.name ?? fallbackName;
  const isSuna = propIsSunaDefault ?? agent?.metadata?.is_suna_default;

  const borderRadiusStyle = {
    borderRadius: `${Math.min(size * 0.25, 16)}px`,
  };

  if (!agent && !propIconName && !propIsSunaDefault && agentId) {
    return (
      <div
        className={cn('bg-muted animate-pulse border', className)}
        style={{ width: size, height: size, ...borderRadiusStyle }}
      />
    );
  }

  if (isSuna) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted border', className)}
        style={{ width: size, height: size, ...borderRadiusStyle }}
      >
        <KortixLogo size={size * 0.6} />
      </div>
    );
  }

  if (iconName) {
    return (
      <div
        className={cn('flex items-center justify-center transition-all border', className)}
        style={{
          width: size,
          height: size,
          backgroundColor,
          ...borderRadiusStyle,
        }}
        title={agentName}
        aria-label={agentName}
      >
        <DynamicIcon name={iconName as any} size={size * 0.5} color={iconColor} />
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center bg-muted border', className)}
      style={{ width: size, height: size, ...borderRadiusStyle }}
      title={agentName}
      aria-label={agentName}
    >
      <DynamicIcon name="bot" size={size * 0.5} color="#6B7280" />
    </div>
  );
};

interface AgentNameProps {
  agent?: Agent;
  agentId?: string;
  fallback?: string;
}

export const AgentName: React.FC<AgentNameProps> = ({
  agent: propAgent,
  agentId,
  fallback = 'Suna',
}) => {
  const cachedAgent = useAgentFromCache(!propAgent && agentId ? agentId : undefined);
  const agent = propAgent || cachedAgent;

  return <span>{agent?.name || fallback}</span>;
};

export function hasCustomProfile(agent: { icon_name?: string | null }): boolean {
  return !!agent.icon_name;
}

export default AgentAvatar;
