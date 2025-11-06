'use client';

import { useEffect } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useAuth } from '@/components/AuthProvider';
import type { CreateTemplateProjectResult } from '@/lib/onboarding/create-template-project-simple';
import { useCreateTemplateProjectSimple } from '@/lib/onboarding/use-create-template-project-simple';
import { NewOnboardingPage } from './new-onboarding-page';
import { onboardingSteps } from './onboarding-config';
import { resetUserContext, userContext } from './shared/context';

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, supabase } = useAuth();
  const {
    isOpen,
    hasCompletedOnboarding,
    startOnboarding,
    completeOnboarding,
  } = useOnboarding();
  const createTemplateProject = useCreateTemplateProjectSimple();

  const resolveProfileType = () => {
    const persona = userContext.persona;

    if (persona?.profile) {
      return persona.profile;
    }

    if (persona?.goal && persona?.focus) {
      const fallback = `${persona.goal}:${persona.focus}`;
      switch (fallback) {
        case 'launch-presence:sales-funnel':
        case 'sell-online:web-experience':
        case 'sell-online:sales-funnel':
          return 'ecommerce';
        case 'understand-data:analysis':
        case 'understand-data:sales-funnel':
        case 'understand-data:web-experience':
          return 'analytics';
        case 'automate-ops:automation':
        case 'automate-ops:sales-funnel':
          return 'automation';
        default:
          return 'website-general';
      }
    }

    return 'website-general';
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const metadataCompleted = Boolean(user.user_metadata?.onboarding_completed);
    const locallyCompleted =
      typeof window !== 'undefined' && localStorage.getItem('onboarding_completed') === 'true';

    if (metadataCompleted || locallyCompleted) {
      if (!hasCompletedOnboarding) {
        completeOnboarding();
      }
      return;
    }

    if (!isOpen && !hasCompletedOnboarding) {
      resetUserContext();
      startOnboarding(onboardingSteps);
    }
  }, [user, isOpen, hasCompletedOnboarding, startOnboarding, completeOnboarding]);

  const handleOnboardingComplete = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_completed', 'true');
    }

    let projectResult: CreateTemplateProjectResult | null = null;

    if (user?.id) {
      try {
        projectResult = await createTemplateProject.mutateAsync({
          userId: user.id,
          profileType: resolveProfileType(),
          persona: userContext.persona,
          onboardingAnswers: {
            userType: userContext.userType,
            companySize: userContext.companySize,
            role: userContext.role,
            primaryGoals: userContext.primaryGoals,
            persona: userContext.persona,
          },
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('onboarding_project_id', projectResult.projectId);
        }
      } catch (error) {
        console.error('[OnboardingProvider] Failed to create template project', error);
      }
    }

    if (user && supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            onboarding_project_id: projectResult?.projectId ?? null,
          },
        });
      } catch (error) {
        console.error('[OnboardingProvider] Failed to update onboarding metadata', error);
      }
    }

    resetUserContext();
    completeOnboarding();

    if (projectResult && typeof window !== 'undefined') {
      window.location.href = `/projects/${projectResult.projectId}/thread/${projectResult.threadId}`;
    }
  };

  return (
    <>
      {children}
      {isOpen && (
        <NewOnboardingPage 
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
}
