'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { BRANDING } from '@/lib/branding';

interface BrandLogoProps {
  size?: number;
}
export function BrandLogo({ size = 24 }: BrandLogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldInvert = mounted && (
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  );

  return (
    <Image
        src={BRANDING.logo.favicon || "/symbol.svg"}
        alt={BRANDING.company}
        width={size}
        height={size}
        className={`${shouldInvert ? 'invert' : ''} flex-shrink-0`}
      />
  );
}

// Keep KortixLogo export for backward compatibility
export const KortixLogo = BrandLogo;
