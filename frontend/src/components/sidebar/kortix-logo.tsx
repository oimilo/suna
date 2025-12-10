'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { BRANDING } from '@/lib/branding';

interface KortixLogoProps {
  size?: number;
  variant?: 'symbol' | 'logomark';
  className?: string;
}

// Backwards compatible: exports KortixLogo but uses Prophet branding
export function KortixLogo({ size = 24, variant = 'symbol', className }: KortixLogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  );

  // For logomark variant, use the appropriate logo based on theme
  if (variant === 'logomark') {
    return (
      <img
        src={isDark ? BRANDING.logo.dark : BRANDING.logo.light}
        alt={BRANDING.name}
        className={cn('flex-shrink-0', className)}
        style={{ height: `${size}px`, width: 'auto' }}
      />
    );
  }

  // Default symbol variant - use favicon/symbol
  return (
    <img
      src={BRANDING.logo.favicon}
      alt={BRANDING.name}
      className={cn('flex-shrink-0', className)}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

// Alias for backwards compatibility
export { KortixLogo as ProphetLogo };
