'use client';

import React from 'react';

interface AgentAvatarProps {
  iconName?: string | null;
  iconColor?: string | null;
  backgroundColor?: string | null;
  agentName?: string | null;
  size?: number;
  className?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  iconName, // reserved for future use (e.g., pixel sets)
  iconColor,
  backgroundColor,
  agentName,
  size = 32,
  className = '',
}) => {
  const displayLetter = (agentName || iconName || 'A').trim().charAt(0).toUpperCase();

  const style: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: backgroundColor || 'var(--muted)',
    color: iconColor || 'var(--foreground)',
    lineHeight: `${size}px`,
    fontSize: Math.max(12, Math.floor(size * 0.45)),
  };

  return (
    <div
      className={`flex items-center justify-center rounded-md select-none ${className}`}
      style={style}
      aria-label={agentName || iconName || 'Agent'}
      title={agentName || iconName || 'Agent'}
    >
      {displayLetter}
    </div>
  );
};

export default AgentAvatar;


