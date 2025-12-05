'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface ProphetLoaderProps {
  /**
   * Size preset for the loader
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  /**
   * Custom size in pixels (overrides size preset)
   */
  customSize?: number;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Additional style for the container
   */
  style?: React.CSSProperties;
  /**
   * Force a specific loader variant (overrides auto-detection)
   * - 'white': White loader (for dark backgrounds)
   * - 'black': Black loader (for light backgrounds)
   * - 'auto': Auto-detect based on theme (default)
   */
  variant?: 'white' | 'black' | 'auto';
  /**
   * @deprecated Use 'variant' instead (kept for backwards compatibility)
   */
  forceTheme?: 'light' | 'dark';
  /**
   * Animation duration in seconds
   * @default 3.5
   */
  duration?: number;
  // Backwards compatibility props (ignored but accepted)
  speed?: number;
  autoPlay?: boolean;
  loop?: boolean;
}

const SIZE_MAP = {
  small: 20,
  medium: 40,
  large: 80,
  xlarge: 120,
} as const;

/**
 * ProphetLoader - CSS-based loading animation with Prophet logo
 * 
 * Features a "line drawing" effect where the logo appears to be drawn,
 * then fills in, pulses, and fades out before looping.
 * 
 * **Automatic Behavior:**
 * - Light mode → Black loader (for white backgrounds)
 * - Dark mode → White loader (for dark backgrounds)
 * 
 * **Manual Override:**
 * Use the `variant` prop when the background doesn't match the theme.
 * 
 * @example
 * ```tsx
 * // Auto-themed (default)
 * <ProphetLoader />
 * 
 * // Always white (for dark backgrounds)
 * <ProphetLoader variant="white" />
 * 
 * // Custom size
 * <ProphetLoader size="large" />
 * ```
 */
export function ProphetLoader({
  size = 'medium',
  customSize,
  className,
  style,
  variant = 'auto',
  forceTheme,
  duration = 3.5,
}: ProphetLoaderProps) {
  const { resolvedTheme } = useTheme();
  const loaderSize = customSize || SIZE_MAP[size];
  
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which variant to use
  let effectiveVariant: 'white' | 'black';
  
  if (variant !== 'auto') {
    effectiveVariant = variant;
  } else if (forceTheme) {
    effectiveVariant = forceTheme === 'dark' ? 'white' : 'black';
  } else {
    const isDark = (resolvedTheme || 'dark') === 'dark';
    effectiveVariant = isDark ? 'white' : 'black';
  }

  // SSR placeholder
  if (!mounted) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)} 
        style={style}
      >
        <div style={{ width: loaderSize, height: loaderSize }} />
      </div>
    );
  }

  const color = effectiveVariant === 'white' ? '#ffffff' : '#292929';
  const animationDuration = `${duration}s`;

  return (
    <div className={cn('flex items-center justify-center', className)} style={style}>
      <svg
        className="prophet-loader"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 500"
        style={{
          width: loaderSize,
          height: loaderSize,
          ['--prophet-color' as string]: color,
          ['--prophet-duration' as string]: animationDuration,
        }}
      >
        <style>{`
          .prophet-loader {
            animation: prophetPulse var(--prophet-duration) ease infinite;
          }
          
          @keyframes prophetPulse {
            0%, 52% { transform: scale(1); }
            58% { transform: scale(1.08); }
            65% { transform: scale(1); }
            100% { transform: scale(1); }
          }
          
          .prophet-loader circle {
            fill: transparent;
            stroke: var(--prophet-color);
            stroke-width: 8;
            stroke-dasharray: 520;
            stroke-dashoffset: 520;
            animation: prophetCircle var(--prophet-duration) ease infinite;
          }
          
          .prophet-loader .letter-p {
            fill: transparent;
            stroke: var(--prophet-color);
            stroke-width: 80;
            stroke-dasharray: 20000;
            stroke-dashoffset: 20000;
            animation: prophetP var(--prophet-duration) ease infinite;
          }
          
          @keyframes prophetCircle {
            0%, 2% {
              stroke-dashoffset: 520;
              stroke-opacity: 1;
              fill: transparent;
              opacity: 0;
            }
            3% { opacity: 1; }
            18% {
              stroke-dashoffset: 0;
              stroke-opacity: 1;
              fill: transparent;
            }
            21% {
              stroke-opacity: 0;
              fill: var(--prophet-color);
            }
            70% {
              stroke-opacity: 0;
              fill: var(--prophet-color);
              opacity: 1;
            }
            80%, 100% {
              stroke-dashoffset: 520;
              stroke-opacity: 0;
              fill: transparent;
              opacity: 0;
            }
          }
          
          @keyframes prophetP {
            0%, 4% {
              stroke-dashoffset: 20000;
              stroke-opacity: 0;
              fill: transparent;
              opacity: 0;
            }
            5% {
              stroke-dashoffset: 20000;
              stroke-opacity: 1;
              fill: transparent;
              opacity: 1;
            }
            50% {
              stroke-dashoffset: 0;
              stroke-opacity: 1;
              fill: transparent;
            }
            52% {
              stroke-opacity: 0;
              fill: var(--prophet-color);
            }
            70% {
              stroke-opacity: 0;
              fill: var(--prophet-color);
              opacity: 1;
            }
            80%, 100% {
              stroke-dashoffset: 20000;
              stroke-opacity: 0;
              fill: transparent;
              opacity: 0;
            }
          }
        `}</style>
        
        {/* Letter P */}
        <g transform="translate(0,500) scale(0.1,-0.1)">
          <path 
            className="letter-p" 
            d="M3695 4321 c518 -117 830 -462 931 -1031 25 -136 25 -462 1 -585 -97
-496 -388 -838 -840 -990 -152 -51 -281 -65 -588 -65 l-279 0 0 -500 0 -500
-430 0 -430 0 0 925 0 924 668 3 c649 3 669 4 729 24 88 30 140 64 201 128 94
100 127 204 120 376 -8 170 -57 267 -174 345 -109 74 -119 75 -879 75 l-665 0
0 450 0 451 768 -4 c754 -3 769 -4 867 -26z"
          />
        </g>
        
        {/* Circle */}
        <circle cx="115" cy="175" r="80" />
      </svg>
    </div>
  );
}

// Backwards compatibility alias
export { ProphetLoader as KortixLoader };

