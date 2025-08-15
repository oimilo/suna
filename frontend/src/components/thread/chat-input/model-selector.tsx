'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles } from 'lucide-react';
import {
  ModelOption,
  SubscriptionStatus,
  DEFAULT_FREE_MODEL_ID,
  DEFAULT_PREMIUM_MODEL_ID,
} from './_use-model-selection';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  modelOptions: ModelOption[];
  canAccessModel: (modelId: string) => boolean;
  subscriptionStatus: SubscriptionStatus;
  refreshCustomModels?: () => void;
  billingModalOpen: boolean;
  isFocused?: boolean;
  setBillingModalOpen: (open: boolean) => void;
  hasBorder?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  modelOptions,
  canAccessModel,
  setBillingModalOpen,
  isFocused = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter to show only our two main models
  const mainModels = modelOptions.filter(
    m => m.id === DEFAULT_FREE_MODEL_ID || m.id === DEFAULT_PREMIUM_MODEL_ID
  );

  const handleSelect = (modelId: string) => {
    const model = mainModels.find(m => m.id === modelId);
    if (!model) return;

    if (canAccessModel(modelId)) {
      onModelChange(modelId);
      setIsOpen(false);
    } else {
      // User doesn't have access - show upgrade modal
      setBillingModalOpen(true);
      setIsOpen(false);
    }
  };

  const renderModelOption = (model: ModelOption) => {
    const isSelected = selectedModel === model.id;
    const isPremium = model.requiresSubscription;
    const hasAccess = canAccessModel(model.id);

    return (
      <DropdownMenuItem
        key={model.id}
        className={cn(
          "flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer",
          !hasAccess && "opacity-60"
        )}
        onClick={() => handleSelect(model.id)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{model.label}</span>
          {model.description && (
            <span className="text-xs text-muted-foreground">
              {model.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPremium && (
            <div className="flex items-center gap-1">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
                PRO
              </span>
            </div>
          )}
          {isSelected && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </div>
      </DropdownMenuItem>
    );
  };

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-2.5 py-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-300",
                    !isFocused && "opacity-20"
                  )}
                  data-tour="model-selector"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Escolha o agente</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent
          align="end"
          className="w-80 p-1"
          sideOffset={8}
        >
          {mainModels.map(renderModelOption)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};