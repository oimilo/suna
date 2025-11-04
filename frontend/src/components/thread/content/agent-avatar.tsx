'use client';

import React from 'react';
import { useAgent } from '@/hooks/react-query/agents/use-agents';
import { KortixLogo } from '@/components/sidebar/kortix-logo';
import { DynamicIcon } from 'lucide-react/dynamic';

interface AgentAvatarProps {
  agentId?: string;
  size?: number;
  className?: string;
  fallbackName?: string;
  iconName?: string;
  iconColor?: string;
  backgroundColor?: string;
  agentName?: string;
  imageUrl?: string;
  isSunaDefault?: boolean;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({ 
  agentId, 
  size = 16, 
  className = "", 
  fallbackName = "Suna",
  iconName,
  iconColor,
  backgroundColor,
  agentName,
  imageUrl,
  isSunaDefault,
}) => {
  const { data: agent, isLoading } = useAgent(agentId || '');

  if (isLoading && agentId) {
    return (
      <div 
        className={`bg-muted animate-pulse rounded ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const resolvedIconName = agent?.icon_name || iconName;
  const resolvedIconColor = agent?.icon_color || iconColor || '#000000';
  const resolvedBackground = agent?.icon_background || backgroundColor || '#F3F4F6';
  const resolvedImageUrl = agent?.profile_image_url || imageUrl;
  const resolvedName = agent?.name || agentName || fallbackName;
  const isSuna = agent?.metadata?.is_suna_default || isSunaDefault;

  if (isSuna) {
    return <KortixLogo size={size} />;
  }

  if (resolvedIconName) {
    return (
      <div 
        className={`flex items-center justify-center rounded ${className}`}
        style={{ 
          width: size, 
          height: size,
          backgroundColor: resolvedBackground,
        }}
      >
        <DynamicIcon 
          name={resolvedIconName as any} 
          size={size * 0.6} 
          color={resolvedIconColor}
        />
      </div>
    );
  }

  if (resolvedImageUrl) {
    return (
      <img 
        src={resolvedImageUrl} 
        alt={resolvedName}
        className={`rounded object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (!agentId) {
    return <KortixLogo size={size} />;
  }

  return <KortixLogo size={size} />;
};

interface AgentNameProps {
  agentId?: string;
  fallback?: string;
}

export const AgentName: React.FC<AgentNameProps> = ({ 
  agentId, 
  fallback = "Suna" 
}) => {
  const { data: agent, isLoading } = useAgent(agentId || '');

  if (isLoading && agentId) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  return <span>{agent?.name || fallback}</span>;
}; 