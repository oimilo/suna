'use client';

import React from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WindowControlsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  variant?: 'macos' | 'windows';
  className?: string;
}

export function WindowControls({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
  variant = 'macos',
  className
}: WindowControlsProps) {
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  if (variant === 'macos') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Minimize button */}
        <button
          onClick={onMinimize}
          onMouseEnter={() => setHoveredButton('minimize')}
          onMouseLeave={() => setHoveredButton(null)}
          className="group relative w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
          title="Minimizar"
        >
          <div className={cn(
            "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
            hoveredButton === 'minimize' && "opacity-100"
          )}>
            <Minus className="w-2 h-2 text-yellow-900/70" strokeWidth={3} />
          </div>
        </button>

        {/* Maximize button */}
        <button
          onClick={onMaximize}
          onMouseEnter={() => setHoveredButton('maximize')}
          onMouseLeave={() => setHoveredButton(null)}
          className="group relative w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          <div className={cn(
            "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
            hoveredButton === 'maximize' && "opacity-100"
          )}>
            {isMaximized ? (
              <Square className="w-1.5 h-1.5 text-green-900/70" strokeWidth={3} />
            ) : (
              <Maximize2 className="w-1.5 h-1.5 text-green-900/70" strokeWidth={3} />
            )}
          </div>
        </button>
      </div>
    );
  }

  // Windows style
  return (
    <div className={cn("flex items-center", className)}>
      <button
        onClick={onMinimize}
        className="px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        title="Minimizar"
      >
        <Minus className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <button
        onClick={onMaximize}
        className="px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        title={isMaximized ? "Restaurar" : "Maximizar"}
      >
        {isMaximized ? (
          <Square className="w-3 h-3 text-muted-foreground" />
        ) : (
          <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
      <button
        onClick={onClose}
        className="px-4 py-2 hover:bg-red-500 hover:text-white transition-colors"
        title="Fechar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}