'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface MiloLogoProps {
  size?: number;
}
export function MiloLogo({ size = 24 }: MiloLogoProps) {
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
        src="/symbol.svg"
        alt="Prophet"
        width={size}
        height={size}
        className={`${shouldInvert ? 'invert' : ''} flex-shrink-0`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
  );
}
