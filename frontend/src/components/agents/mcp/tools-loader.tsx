'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ToolsLoaderProps {
  toolCount?: number;
}

export const ToolsLoader: React.FC<ToolsLoaderProps> = ({ toolCount = 6 }) => {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto">
      {Array.from({ length: toolCount }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

