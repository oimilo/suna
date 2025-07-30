'use client';

import { useOnboardingStore } from '@/hooks/use-onboarding-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RotateCcw, FastForward, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function OnboardingDevControls() {
  const [isVisible, setIsVisible] = useState(true);
  const {
    hasSeenWelcome,
    hasCompletedTour,
    hasCreatedFirstProject,
    hasRunFirstCommand,
    tourStep,
    checklistSteps,
    devMode,
    setDevMode,
    resetOnboarding,
    skipOnboarding,
    setHasSeenWelcome,
    setHasCompletedTour,
    setTourStep
  } = useOnboardingStore();

  // Only show in development
  if (process.env.NODE_ENV === 'production' && !devMode) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Dev Controls
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Onboarding Dev Controls</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={resetOnboarding}
            className="flex-1 gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={skipOnboarding}
            className="flex-1 gap-2"
          >
            <FastForward className="h-3 w-3" />
            Skip All
          </Button>
        </div>

        {/* Status */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Viu boas-vindas:</span>
            <Badge variant={hasSeenWelcome ? "default" : "secondary"}>
              {hasSeenWelcome ? "Sim" : "Não"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Completou tour:</span>
            <Badge variant={hasCompletedTour ? "default" : "secondary"}>
              {hasCompletedTour ? "Sim" : "Não"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Tour step:</span>
            <Badge variant="outline">{tourStep}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Primeiro projeto:</span>
            <Badge variant={hasCreatedFirstProject ? "default" : "secondary"}>
              {hasCreatedFirstProject ? "Sim" : "Não"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Primeiro comando:</span>
            <Badge variant={hasRunFirstCommand ? "default" : "secondary"}>
              {hasRunFirstCommand ? "Sim" : "Não"}
            </Badge>
          </div>
        </div>

        {/* Checklist Progress */}
        <div className="space-y-1">
          <p className="text-xs font-medium">Checklist Progress:</p>
          <div className="space-y-1">
            {checklistSteps.map(step => (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={step.completed}
                  readOnly
                  className="h-3 w-3"
                />
                <span className={step.completed ? 'line-through opacity-60' : ''}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Controls */}
        <div className="space-y-2 border-t pt-2">
          <p className="text-xs font-medium">Manual Controls:</p>
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHasSeenWelcome(!hasSeenWelcome)}
              className="w-full text-xs"
            >
              Toggle Welcome: {hasSeenWelcome ? 'ON' : 'OFF'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHasCompletedTour(!hasCompletedTour)}
              className="w-full text-xs"
            >
              Toggle Tour: {hasCompletedTour ? 'ON' : 'OFF'}
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTourStep(Math.max(0, tourStep - 1))}
                className="flex-1 text-xs"
              >
                Tour -1
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTourStep(tourStep + 1)}
                className="flex-1 text-xs"
              >
                Tour +1
              </Button>
            </div>
          </div>
        </div>

        {/* Dev Mode Toggle */}
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-xs">Dev Mode</span>
          <Switch
            checked={devMode}
            onCheckedChange={setDevMode}
          />
        </div>
      </CardContent>
    </Card>
  );
}