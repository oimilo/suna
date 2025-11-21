'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { BRANDING } from '@/lib/branding';

interface KortixLogoProps {
  size?: number;
  variant?: 'symbol' | 'logomark' | 'wordmark';
  className?: string;
}
export function KortixLogo({ size = 24, variant = 'symbol', className = '' }: KortixLogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldInvert = mounted && (
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  );

  const getLogoSrc = () => {
    switch (variant) {
      case 'wordmark':
        return shouldInvert ? BRANDING.logo.dark : BRANDING.logo.light;
      case 'logomark':
        return BRANDING.logo.favicon || '/kortix-symbol.svg';
      default:
        return '/kortix-symbol.svg';
    }
  };

  return (
    <Image
      src={getLogoSrc()}
      alt={BRANDING.company}
      width={size}
      height={size}
      className={`${shouldInvert ? 'invert' : ''} flex-shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}
