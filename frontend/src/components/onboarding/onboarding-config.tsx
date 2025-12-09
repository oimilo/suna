'use client';

import { OnboardingStep } from '@/hooks/onboarding';
import { CEOIntroStep } from './steps/ceo-intro-step';
import { UserTypeStep } from './steps/user-type-step';
import { WorkforceSelectionStep } from './steps/workforce-selection-step';
import { CredentialsStep } from './steps/credentials-step';
import { CompletionStep } from './steps/completion-step';
import { userContext } from './shared/context';

// Fixed onboarding steps - clean, organized flow
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'ceo-intro',
    title: 'Welcome',
    description: 'Introduction from our CEO',
    content: <CEOIntroStep />,
    canSkip: false,
    actionLabel: 'Get Started'
  },
  {
    id: 'user-type',
    title: 'Getting Started',
    description: 'Individual or Company',
    content: <UserTypeStep />,
    canSkip: false,
    actionLabel: 'Continue'
  },
  {
    id: 'workforce-selection',
    title: 'Choose Agents',
    description: 'Select your AI workforce',
    content: <WorkforceSelectionStep />,
    canSkip: true,
    actionLabel: 'Connect Accounts'
  },
  {
    id: 'credentials',
    title: 'Connect Accounts',
    description: 'Link your external accounts',
    content: <CredentialsStep />,
    canSkip: true,
    actionLabel: 'Create Agents'
  },
  {
    id: 'completion',
    title: 'Complete',
    description: 'Your AI workforce is ready',
    content: <CompletionStep />,
    canSkip: false,
    actionLabel: 'Start Working'
  }
];

// Helper functions for navigation and validation
export const getStepByIndex = (index: number): OnboardingStep | null => {
  return onboardingSteps[index] || null;
};

export const getStepById = (id: string): OnboardingStep | null => {
  return onboardingSteps.find(step => step.id === id) || null;
};

export const getStepIndex = (id: string): number => {
  return onboardingSteps.findIndex(step => step.id === id);
};

export const isValidStepIndex = (index: number): boolean => {
  return index >= 0 && index < onboardingSteps.length;
};

export const canSkipStep = (index: number): boolean => {
  const step = getStepByIndex(index);
  return step?.canSkip || false;
};

export const isFirstStep = (index: number): boolean => {
  return index === 0;
};

export const isLastStep = (index: number): boolean => {
  return index === onboardingSteps.length - 1;
};

// Progress calculation
export const getProgressPercentage = (currentStep: number): number => {
  return Math.round(((currentStep + 1) / onboardingSteps.length) * 100);
};

// Check if credentials step should be shown
// (only if selected templates have MCP requirements)
export const shouldShowCredentialsStep = (): boolean => {
  const selectedTemplates = userContext.selectedTemplates || [];
  const hasRequirements = selectedTemplates.some(t => 
    (t.mcp_requirements || []).length > 0
  );
  return hasRequirements;
};

// Step validation (can be extended for more complex validation)
export const canProceedFromStep = (stepIndex: number, context?: any): boolean => {
  const step = getStepByIndex(stepIndex);
  if (!step) return false;

  // Basic validation logic - can be extended
  switch (step.id) {
    case 'user-type':
      // Individuals can proceed immediately, companies need size and role
      if (context?.userType === 'individual') {
        return true;
      }
      if (context?.userType === 'company') {
        return !!(context?.companySize && context?.role);
      }
      return false;
    
    case 'workforce-selection':
      // Can always proceed (skip allowed), but ideally has templates selected
      return true;
    
    case 'credentials':
      // Can always proceed (skip allowed), credentials are optional
      return true;
    
    default:
      return true;
  }
};
