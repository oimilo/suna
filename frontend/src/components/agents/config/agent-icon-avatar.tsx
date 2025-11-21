'use client';

import * as React from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { cn } from '@/lib/utils';

interface AgentIconAvatarProps {
  iconName?: string | null;
  iconColor?: string | null;
  iconBackground?: string | null;
  /**
   * Temporary alias used by older components. Prefer `iconBackground`.
   */
  backgroundColor?: string | null;
  profileImageUrl?: string | null;
  name?: string | null;
  agentName?: string | null;
  size?: number;
  className?: string;
}

/**
 * Lightweight avatar renderer used across the dashboard and dialogs when we
 * already have the agent metadata in memory. This mirrors the previous local
 * implementation so that older imports keep working while we migrate to the
 * upstream UI.
 */
export function AgentIconAvatar({
  iconName,
  iconColor = '#000000',
  iconBackground,
  backgroundColor,
  profileImageUrl,
  name,
  agentName,
  size = 48,
  className,
}: AgentIconAvatarProps) {
  const resolvedBackground = backgroundColor ?? iconBackground ?? '#F3F4F6';
  const displayName = agentName ?? name ?? 'Agent';

  if (profileImageUrl) {
    return (
      <img
        src={profileImageUrl}
        alt={displayName}
        className={cn('rounded-lg object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  if (iconName) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-lg border border-border', className)}
        style={{ width: size, height: size, backgroundColor: resolvedBackground }}
      >
        <DynamicIcon name={iconName as any} size={size * 0.55} color={iconColor || '#000000'} />
      </div>
    );
  }

  const initials =
    displayName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground font-semibold',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

