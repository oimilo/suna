import * as React from 'react';
import { type ViewProps } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import type { Agent } from '@/api/types';

interface AgentAvatarProps extends ViewProps {
  agent?: Agent;
  size?: number;
}

/**
 * AgentAvatar Component - Agent-specific wrapper around unified Avatar
 * 
 * Uses the unified Avatar component with agent-specific configuration.
 * Automatically handles:
 * - Agent icon from backend (icon_name)
 * - Agent colors (icon_color, icon_background)
 * - SUNA/KORTIX SUPER WORKER special case (Milo symbol)
 * - Fallback to agent name initial
 * 
 * @example
 * <AgentAvatar agent={agent} size={48} />
 */
export function AgentAvatar({ agent, size = 48, style, ...props }: AgentAvatarProps) {
  // Check if this is the SUNA/KORTIX SUPER WORKER
  const isProphetAgent = agent?.metadata?.is_prophet_default || 
                      agent?.name?.toLowerCase() === 'prophet' ||
                      agent?.name?.toLowerCase() === 'superworker' ||
                      agent?.name?.toLowerCase() === 'milo super worker';

  return (
    <Avatar
      variant="agent"
      size={size}
      icon={agent?.icon_name || undefined}
      iconColor={isProphetAgent ? undefined : agent?.icon_color}
      backgroundColor={isProphetAgent ? undefined : agent?.icon_background}
      useMiloSymbol={isProphetAgent}
      fallbackText={agent?.name}
      style={style}
      {...props}
    />
  );
}

