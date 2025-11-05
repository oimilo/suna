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
    // TODO: refinar mapeamento assim que definirmos as combinações de passos do onboarding
    const selectedAgents = userContext.selectedAgents ?? [];

    if (selectedAgents.includes('lead-generator')) {
      return 'ecommerce';
    }

    if (selectedAgents.includes('meeting-researcher')) {
      return 'analytics';
    }

    if (selectedAgents.includes('presentation-creator')) {
      return 'content-visual';
    }

    if (userContext.primaryGoals?.some((goal) => goal.toLowerCase().includes('automation'))) {
      return 'automation';
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
          onboardingAnswers: {
            userType: userContext.userType,
            companySize: userContext.companySize,
            role: userContext.role,
            primaryGoals: userContext.primaryGoals,
            selectedAgents: userContext.selectedAgents,
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
