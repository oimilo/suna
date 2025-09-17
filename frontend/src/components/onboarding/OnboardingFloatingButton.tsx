'use client';

import { useOnboardingStore } from '@/hooks/use-onboarding-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, X, RotateCcw, ChevronUp, ChevronDown, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

export function OnboardingFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { 
    checklistSteps, 
    isOnboardingComplete, 
    resetOnboarding,
    skipOnboarding 
  } = useOnboardingStore();

  // Hide on specific pages
  const shouldHide = pathname?.includes('/projects/new') || 
                    pathname?.includes('/projects/') ||
                    pathname?.includes('/auth');

  // Don't show if onboarding is complete or should hide
  if (isOnboardingComplete() || shouldHide) {
    return null;
  }

  const completedSteps = checklistSteps.filter(step => step.completed).length;
  const totalSteps = checklistSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            size="lg"
            className={cn(
              "rounded-full h-14 w-14 p-0 shadow-lg relative group",
              "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            <div className="absolute inset-0 rounded-full">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-20"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${(progressPercentage / 100) * 150.8} 150.8`}
                  className="transition-all duration-500"
                />
              </svg>
            </div>
            <HelpCircle className="h-6 w-6" />
            {!isOpen && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        </motion.div>
      </PopoverTrigger>
      
      <PopoverContent 
        side="top" 
        align="end" 
        className="w-80 p-0"
        sideOffset={10}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Primeiros Passos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {completedSteps} de {totalSteps} completos
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progressPercentage} className="h-2 mt-3" />
        </div>
        
        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
          {checklistSteps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-all",
                step.completed 
                  ? "opacity-60 bg-muted/30" 
                  : "hover:bg-muted/50"
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn(
                "flex-1",
                step.completed && "line-through"
              )}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Reset and start tour immediately
              resetOnboarding();
              setTimeout(() => {
                useOnboardingStore.getState().setHasSeenWelcome(true);
              }, 100);
            }}
            className="w-full text-xs gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            Reiniciar Tour
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              skipOnboarding();
              setIsOpen(false);
            }}
            className="w-full text-xs text-muted-foreground"
          >
            Pular onboarding
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}