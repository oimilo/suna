'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap } from 'lucide-react';
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
  subscriptionStatus,
  setBillingModalOpen,
  isFocused = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter to show only our two main models
  const freeModel = modelOptions.find(m => m.id === DEFAULT_FREE_MODEL_ID);
  const premiumModel = modelOptions.find(m => m.id === DEFAULT_PREMIUM_MODEL_ID);

  const isAdvancedMode = selectedModel === DEFAULT_PREMIUM_MODEL_ID;
  const isPaidUser = subscriptionStatus === 'active';

  const handleModelSelect = (modelId: string) => {
    if (isPaidUser || modelId === DEFAULT_FREE_MODEL_ID) {
      onModelChange(modelId);
      setIsOpen(false);
    } else {
      // Free user trying to access premium - show upgrade modal
      setBillingModalOpen(true);
    }
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
                    "h-8 px-2.5 py-1.5 rounded-xl transition-all duration-300",
                    isAdvancedMode ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground",
                    isAdvancedMode ? "hover:bg-violet-50 dark:hover:bg-violet-950/20" : "hover:bg-accent/50",
                    !isFocused && "opacity-20"
                  )}
                  data-tour="model-selector"
                >
                  <Zap className={cn(
                    "h-4 w-4",
                    isAdvancedMode && "fill-violet-600 dark:fill-violet-400"
                  )} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>{isAdvancedMode ? 'Modo Avançado' : 'Modo Padrão'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent
          align="end"
          className="w-72 p-4 overflow-hidden bg-white dark:bg-zinc-950 border border-black/6 dark:border-white/8 shadow-lg"
          sideOffset={8}
        >
          <div className="space-y-4">
            {/* Header */}
            <div>
              <p className="text-xs text-muted-foreground">
                Escolha o modo
              </p>
            </div>

            {/* Model Cards */}
            <div className="space-y-3">
              <button
                onClick={() => handleModelSelect(DEFAULT_FREE_MODEL_ID)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all duration-200",
                  !isAdvancedMode 
                    ? "border-black/6 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.02]" 
                    : "border-black/6 dark:border-white/8 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{freeModel?.label}</span>
                  {!isAdvancedMode && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rápido e eficiente para tarefas do dia a dia
                </p>
              </button>

              <button
                onClick={() => handleModelSelect(DEFAULT_PREMIUM_MODEL_ID)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all duration-200",
                  isAdvancedMode 
                    ? "border-violet-500/20 dark:border-violet-400/20 bg-violet-50/50 dark:bg-violet-950/20" 
                    : "border-black/6 dark:border-white/8 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]",
                  !isPaidUser && "opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{premiumModel?.label}</span>
                  <div className="flex items-center gap-2">
                    {isAdvancedMode && (
                      <div className="w-5 h-5 rounded-full bg-violet-500/10 dark:bg-violet-400/10 border border-violet-500/20 dark:border-violet-400/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                      </div>
                    )}
                    {!isPaidUser && <Crown className="h-3.5 w-3.5 text-violet-500" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ideal para tarefas complexas e raciocínio avançado
                </p>
              </button>
            </div>

            {/* Upgrade Section for Free Users */}
            {!isPaidUser && (
              <div className="pt-3 border-t border-black/6 dark:border-white/8">
                <Button
                  size="sm"
                  className="w-full h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  onClick={() => {
                    setBillingModalOpen(true);
                    setIsOpen(false);
                  }}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Desbloquear Modo Avançado
                </Button>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};