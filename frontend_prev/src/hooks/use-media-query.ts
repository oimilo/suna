'use client';

import { useEffect, useState } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpointValues: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useMediaQuery(query: string) {
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setIsMatch(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setIsMatch(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return isMatch;
}

export function useBreakpoint(breakpoint: Breakpoint) {
  return useMediaQuery(`(min-width: ${breakpointValues[breakpoint]}px)`);
}


