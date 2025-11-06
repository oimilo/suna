'use client';

import { OnboardingStep } from '@/hooks/use-onboarding';
import { CEOIntroStep } from './steps/ceo-intro-step';
import { UserTypeStep } from './steps/user-type-step';
import { SmartContextStep } from './steps/smart-context-step';
import { PersonalitySelectionStep } from './steps/personality-selection-step';
import { PersonaSummaryStep } from './steps/persona-summary-step';
import { CompletionStep } from './steps/completion-step';

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
    id: 'persona-selection',
    title: 'Personalize',
    description: 'Escolha o foco e o tom do seu workspace',
    content: <PersonalitySelectionStep />,
    canSkip: false,
    actionLabel: 'Avançar'
  },
  {
    id: 'persona-summary',
    title: 'Resumo',
    description: 'Confirme preferências e integrações',
    content: <PersonaSummaryStep />,
    canSkip: false,
    actionLabel: 'Continuar'
  },
  // {
  //   id: 'team-invitation',
  //   title: 'Invite Team',
  //   description: 'Add your teammates',
  //   content: <TeamInvitationStep />,
  //   canSkip: true,
  //   actionLabel: 'Finish Setup'
  // },
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
    
    case 'persona-selection':
      return Boolean(context?.persona?.goal && context.persona.focus && context.persona.tone);
    case 'persona-summary':
      return Boolean(context?.persona?.goal && context.persona?.profile);
    
    default:
      return true;
  }
};

