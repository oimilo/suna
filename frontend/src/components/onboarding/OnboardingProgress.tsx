'use client';

import { useOnboardingStore } from '@/hooks/use-onboarding-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function OnboardingProgress() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { checklistSteps, isOnboardingComplete, resetOnboarding } = useOnboardingStore();

  // Don't show if onboarding is complete
  if (isOnboardingComplete()) {
    return null;
  }

  const completedSteps = checklistSteps.filter(step => step.completed).length;
  const totalSteps = checklistSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Primeiros Passos</CardTitle>
            <span className="text-xs text-muted-foreground">
              {completedSteps} de {totalSteps}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Progress value={progressPercentage} className="h-2 mt-2" />
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {checklistSteps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2 text-sm transition-opacity",
                  step.completed && "opacity-60"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={cn(step.completed && "line-through")}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          
          {progressPercentage > 0 && progressPercentage < 100 && (
            <div className="mt-4 pt-4 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={resetOnboarding}
                className="w-full text-xs"
              >
                Reiniciar Tour
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}