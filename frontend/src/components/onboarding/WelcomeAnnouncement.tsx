'use client';

import { useEffect, useRef, useState } from 'react';
import { useOnboardingStore } from '@/hooks/use-onboarding-store';
import { WelcomeFullScreen } from './WelcomeFullScreen';
import { useAuth } from '@/components/AuthProvider';

export function WelcomeAnnouncement() {
  const { 
    hasSeenWelcome, 
    setHasSeenWelcome, 
    updateChecklistStep,
    setTourStep
  } = useOnboardingStore();
  const { user } = useAuth();
  const [showFullScreen, setShowFullScreen] = useState(false);
  const metadataHydrated = useRef(false);


  const handleStart = () => {
    console.log('[WelcomeAnnouncement] Starting onboarding!');
    setShowFullScreen(false);
    setHasSeenWelcome(true);
    updateChecklistStep('welcome', true);
    setTourStep(0);
    console.log('[WelcomeAnnouncement] tourStep set to 0');
  };

  const handleSkip = () => {
    console.log('[WelcomeAnnouncement] Skipping onboarding');
    setShowFullScreen(false);
    setHasSeenWelcome(true);
    updateChecklistStep('welcome', true);
    useOnboardingStore.getState().skipOnboarding();
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_completed', 'true');
    }
  };

  useEffect(() => {
    if (!user || metadataHydrated.current) {
      return;
    }

    const metadataCompleted = Boolean(user.user_metadata?.onboarding_completed);

    if (metadataCompleted) {
      metadataHydrated.current = true;
      setHasSeenWelcome(true);
      updateChecklistStep('welcome', true);
      const { skipOnboarding } = useOnboardingStore.getState();
      skipOnboarding();

      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_completed', 'true');
        const storedProject = user.user_metadata?.onboarding_project_id;
        if (storedProject) {
          localStorage.setItem('onboarding_project_id', storedProject as string);
        }
      }
    }
  }, [setHasSeenWelcome, updateChecklistStep, user]);

  useEffect(() => {
    // Verificar se o onboarding já foi completado
    const metadataCompleted = Boolean(user?.user_metadata?.onboarding_completed);
    const isCompleted = metadataCompleted || (typeof window !== 'undefined' && localStorage.getItem('onboarding_completed') === 'true');
    
    // Only show once and if not completed
    if (!hasSeenWelcome && !isCompleted) {
      // Show fullscreen welcome after a short delay
      setTimeout(() => {
        setShowFullScreen(true);
      }, 500);
    }
  }, [hasSeenWelcome, user]);

  return showFullScreen ? (
    <WelcomeFullScreen onStart={handleStart} onSkip={handleSkip} />
  ) : null;
}