'use client';

import { useOnboardingStore } from '@/hooks/use-onboarding-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OnboardingQuestions } from './OnboardingQuestions';

export function OnboardingTour() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { 
    hasSeenWelcome = false, 
    tourStep = 0,
    setTourStep,
    updateChecklistStep,
    setOnboardingResponses 
  } = store;

  // Verificar se o onboarding já foi completado
  const isCompleted = typeof window !== 'undefined' && localStorage.getItem('onboarding_completed') === 'true';
  
  // Only show questions if welcome was seen and tour step is 0 AND not completed
  const shouldShowQuestions = hasSeenWelcome && tourStep === 0 && !isCompleted;
  
  // Debug logs (opt-in via env flag to avoid console spam in production)
  if (process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === 'true') {
    console.debug('[OnboardingTour] Debug:', {
      hasSeenWelcome: hasSeenWelcome || false,
      tourStep: tourStep || 0,
      shouldShowQuestions,
      isCompleted,
    });
  }

  const handleQuestionsComplete = async (responses: any) => {
    try {
      // Convert array to object format
      const responsesObject = responses.reduce((acc: any, curr: any) => {
        acc[curr.questionId] = curr.answer;
        return acc;
      }, {});
      
      // Store responses in onboarding store
      setOnboardingResponses(responsesObject);
      
      // Also save to localStorage as backup
      localStorage.setItem('onboarding_responses', JSON.stringify(responsesObject));
      
      // Mock: Analyze responses and determine template
      const templateType = determineTemplate(responsesObject);
      console.log('Template selecionado:', templateType);
      
      // Mark questions as completed
      updateChecklistStep('questions', true);
      
      // Reset tour step
      setTourStep(-1);
      
      toast.success('✨ Workspace personalizado preparado com sucesso!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error('Erro ao processar respostas');
    }
  };

  // Mock function to determine template based on responses
  const determineTemplate = (responses: Record<string, any>) => {
    const { profession, project_type, tech_level } = responses;
    
    // Simple mock logic for template selection
    if (profession === 'developer' && project_type === 'api') {
      return 'backend-api-template';
    } else if (profession === 'designer' && project_type === 'website') {
      return 'landing-page-template';
    } else if (project_type === 'ecommerce') {
      return 'ecommerce-template';
    } else if (project_type === 'dashboard') {
      return 'analytics-dashboard-template';
    } else if (tech_level < 30) {
      return 'no-code-template';
    } else {
      return 'blank-project-template';
    }
  };

  const handleSkip = () => {
    updateChecklistStep('questions', true);
    setTourStep(-1);
    router.push('/dashboard');
  };

  if (shouldShowQuestions) {
    return (
      <OnboardingQuestions 
        onComplete={handleQuestionsComplete}
        onSkip={handleSkip}
      />
    );
  }

  return null;
}
