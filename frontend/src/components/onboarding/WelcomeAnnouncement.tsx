'use client';

import { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/hooks/use-onboarding-store';
import { WelcomeFullScreen } from './WelcomeFullScreen';

export function WelcomeAnnouncement() {
  const { 
    hasSeenWelcome, 
    setHasSeenWelcome, 
    updateChecklistStep,
    setTourStep
  } = useOnboardingStore();
  const [showFullScreen, setShowFullScreen] = useState(false);


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
  };

  useEffect(() => {
    // Verificar se o onboarding já foi completado
    const isCompleted = localStorage.getItem('onboarding_completed') === 'true';
    
    // Only show once and if not completed
    if (!hasSeenWelcome && !isCompleted) {
      // Show fullscreen welcome after a short delay
      setTimeout(() => {
        setShowFullScreen(true);
      }, 500);
    }
  }, [hasSeenWelcome]);

  return showFullScreen ? (
    <WelcomeFullScreen onStart={handleStart} onSkip={handleSkip} />
  ) : null;
}