'use client';

import React, { useEffect, useState } from 'react';
import { Github } from 'lucide-react';
import { FaGoogle, FaSlack, FaWhatsapp, FaTrello } from 'react-icons/fa';
import { SiNotion } from 'react-icons/si';
import { cn } from '@/lib/utils';

interface FloatingPill {
  id: string;
  Icon: React.ElementType;
  color?: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  lineEnd: {
    x: string;
    y: string;
  };
}

const pills: FloatingPill[] = [
  {
    id: 'github',
    Icon: Github,
    position: { top: '10%', left: '-5%' },
    lineEnd: { x: '42%', y: '48%' },
  },
  {
    id: 'google',
    Icon: FaGoogle,
    color: 'text-blue-500',
    position: { top: '15%', right: '-5%' },
    lineEnd: { x: '58%', y: '48%' },
  },
  {
    id: 'slack',
    Icon: FaSlack,
    color: 'text-purple-600',
    position: { bottom: '20%', left: '-3%' },
    lineEnd: { x: '43%', y: '52%' },
  },
  {
    id: 'notion',
    Icon: SiNotion,
    position: { bottom: '25%', right: '-3%' },
    lineEnd: { x: '57%', y: '52%' },
  },
  {
    id: 'whatsapp',
    Icon: FaWhatsapp,
    color: 'text-green-500',
    position: { top: '45%', left: '-8%' },
    lineEnd: { x: '45%', y: '50%' },
  },
  {
    id: 'trello',
    Icon: FaTrello,
    color: 'text-blue-600',
    position: { top: '50%', right: '-8%' },
    lineEnd: { x: '55%', y: '50%' },
  },
];

export function FloatingPills() {
  const [visiblePills, setVisiblePills] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Show pills one by one
    pills.forEach((pill, index) => {
      setTimeout(() => {
        setVisiblePills(prev => [...prev, pill.id]);
      }, index * 400 + 800);
    });

    // After all pills are shown, cycle through highlighting them
    const cycleInterval = setInterval(() => {
      // This could be used for future hover-like effects
    }, 3000);

    return () => clearInterval(cycleInterval);
  }, [mounted]);

  if (!mounted) return null;

  const getLineCoordinates = (pill: FloatingPill) => {
    // Calculate line start position based on pill position
    let x1 = '50%', y1 = '50%';
    
    if (pill.position.left) {
      x1 = `calc(${pill.position.left} + 24px)`;
    } else if (pill.position.right) {
      x1 = `calc(100% - ${pill.position.right} - 24px)`;
    }
    
    if (pill.position.top) {
      y1 = `calc(${pill.position.top} + 24px)`;
    } else if (pill.position.bottom) {
      y1 = `calc(100% - ${pill.position.bottom} - 24px)`;
    }
    
    return { x1, y1, x2: pill.lineEnd.x, y2: pill.lineEnd.y };
  };

  const getPathData = (coords: { x1: string; y1: string; x2: string; y2: string }, pillId: string): string | null => {
    // Create curved paths for some pills, straight for others
    const curvedPills = ['google', 'slack', 'whatsapp'];
    
    if (curvedPills.includes(pillId)) {
      // Parse percentages, handling calc() expressions
      const parseCoord = (coord: string): number => {
        if (coord.includes('calc')) {
          // For calc expressions, estimate position
          if (coord.includes('-5%')) return -5;
          if (coord.includes('-8%')) return -8;
          if (coord.includes('-3%')) return -3;
          if (coord.includes('+ 24px')) return 10; // Approximate
          return 50;
        }
        return parseFloat(coord.replace('%', ''));
      };
      
      const x1Num = parseCoord(coords.x1);
      const y1Num = parseCoord(coords.y1);
      const x2Num = parseCoord(coords.x2);
      const y2Num = parseCoord(coords.y2);
      
      // Control point offset based on pill position
      let cpX: number;
      let cpY: number;
      
      if (pillId === 'google') {
        // Curve down then left
        cpX = x1Num - 15;
        cpY = y1Num + 20;
      } else if (pillId === 'slack') {
        // Curve up then right
        cpX = x1Num + 15;
        cpY = y1Num - 20;
      } else {
        // Gentle S-curve
        cpX = (x1Num + x2Num) / 2 + 10;
        cpY = (y1Num + y2Num) / 2;
      }
      
      return `M ${coords.x1} ${coords.y1} Q ${cpX}% ${cpY}% ${coords.x2} ${coords.y2}`;
    }
    
    // Straight line for others
    return null;
  };

  return (
    <>
      {/* SVG Lines Container */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <linearGradient id="pillLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(139 92 246)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="rgb(139 92 246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(139 92 246)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {pills.map((pill) => {
          const isVisible = visiblePills.includes(pill.id);
          const coords = getLineCoordinates(pill);
          const pathData = getPathData(coords, pill.id);
          
          return (
            <g key={`line-${pill.id}`}>
              {pathData ? (
                <>
                  {/* Curved path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="url(#pillLine)"
                    strokeWidth="1.5"
                    strokeDasharray="4,6"
                    className={cn(
                      "transition-all duration-1500",
                      isVisible ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                      strokeDashoffset: isVisible ? 0 : 300,
                      animation: isVisible ? 'draw-line 2.5s ease-out' : 'none',
                    }}
                  />
                  {/* Glow effect for curved */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="rgb(139 92 246)"
                    strokeWidth="3"
                    strokeDasharray="4,6"
                    className={cn(
                      "transition-all duration-1500",
                      isVisible ? "opacity-10" : "opacity-0"
                    )}
                    style={{
                      filter: 'blur(3px)',
                      strokeDashoffset: isVisible ? 0 : 300,
                    }}
                  />
                </>
              ) : (
                <>
                  {/* Straight line */}
                  <line
                    x1={coords.x1}
                    y1={coords.y1}
                    x2={coords.x2}
                    y2={coords.y2}
                    stroke="url(#pillLine)"
                    strokeWidth="1.5"
                    strokeDasharray="4,6"
                    className={cn(
                      "transition-all duration-1500",
                      isVisible ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                      strokeDashoffset: isVisible ? 0 : 100,
                      animation: isVisible ? 'draw-line 2s ease-out' : 'none',
                    }}
                  />
                  {/* Glow effect for straight */}
                  <line
                    x1={coords.x1}
                    y1={coords.y1}
                    x2={coords.x2}
                    y2={coords.y2}
                    stroke="rgb(139 92 246)"
                    strokeWidth="3"
                    strokeDasharray="4,6"
                    className={cn(
                      "transition-all duration-1500",
                      isVisible ? "opacity-10" : "opacity-0"
                    )}
                    style={{
                      filter: 'blur(3px)',
                      strokeDashoffset: isVisible ? 0 : 100,
                    }}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Pills */}
      {pills.map((pill) => {
        const Icon = pill.Icon;
        const isVisible = visiblePills.includes(pill.id);
        
        return (
          <div
            key={pill.id}
            className={cn(
              "absolute flex items-center justify-center",
              "w-12 h-12",
              "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
              "border border-violet-200/50 dark:border-violet-800/50",
              "rounded-xl shadow-lg",
              "transition-all duration-700 ease-out",
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50",
              "hover:scale-110 hover:shadow-xl hover:border-violet-300 dark:hover:border-violet-700"
            )}
            style={{
              ...pill.position,
              zIndex: 2,
              animation: isVisible ? 'float 3s ease-in-out infinite' : 'none',
              animationDelay: `${pills.indexOf(pill) * 0.5}s`,
            }}
          >
            <Icon 
              className={cn(
                "w-6 h-6",
                pill.color || "text-gray-700 dark:text-gray-300"
              )}
            />
          </div>
        );
      })}
    </>
  );
}