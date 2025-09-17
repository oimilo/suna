'use client';

import React from 'react';
import { Cpu } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface FixedModelDisplayProps {
  isFocused?: boolean;
}

export const FixedModelDisplay: React.FC<FixedModelDisplayProps> = ({
  isFocused = false,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 py-2 bg-transparent border-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 flex items-center gap-2 transition-all duration-300 ${!isFocused ? 'opacity-20' : 'opacity-100'} cursor-default`}
            disabled
          >
            <div className="relative flex items-center justify-center">
              <Cpu className="h-4 w-4" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Claude Sonnet 4</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};