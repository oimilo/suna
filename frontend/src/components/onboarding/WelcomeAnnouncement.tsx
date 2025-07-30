'use client';

import { useEffect } from 'react';
import { useAnnouncementStore } from '@/hooks/use-announcement-store';
import { useOnboardingStore } from '@/hooks/use-onboarding-store';

export function WelcomeAnnouncement() {
  const { addAnnouncement } = useAnnouncementStore();
  const { 
    hasSeenWelcome, 
    setHasSeenWelcome, 
    updateChecklistStep 
  } = useOnboardingStore();

  useEffect(() => {
    // Only show once
    if (!hasSeenWelcome) {
      const announcementId = addAnnouncement({
        type: 'onboarding',
        title: 'Bem-vindo ao Prophet! 🌞',
        description: 'Seu assistente de IA está pronto para ajudar você a criar, analisar e automatizar.',
        priority: 'high',
        persistent: false,
        htmlContent: `
          <div class="space-y-4">
            <div class="text-sm text-muted-foreground">
              <p>O Prophet pode ajudar você com:</p>
              <ul class="list-disc list-inside mt-2 space-y-1">
                <li>🚀 Criar e deploy de sites e aplicações</li>
                <li>📊 Análise de dados e visualizações</li>
                <li>🤖 Automação de tarefas repetitivas</li>
                <li>🎨 Geração e edição de imagens</li>
                <li>📝 Escrita e revisão de conteúdo</li>
              </ul>
            </div>
            <div class="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
              <p class="text-sm">
                <span class="font-semibold">Dica:</span> Comece criando um novo projeto ou iniciando uma conversa!
              </p>
            </div>
          </div>
        `,
        actions: [
          {
            id: 'start-tour',
            label: 'Fazer Tour Guiado',
            variant: 'default',
            onClick: () => {
              setHasSeenWelcome(true);
              updateChecklistStep('welcome', true);
              // Tour will start automatically when hasSeenWelcome becomes true
            }
          },
          {
            id: 'skip',
            label: 'Começar a Usar',
            variant: 'outline',
            onClick: () => {
              setHasSeenWelcome(true);
              updateChecklistStep('welcome', true);
              // Skip tour
              useOnboardingStore.getState().skipOnboarding();
            }
          }
        ]
      });

      // Auto-show after a short delay
      setTimeout(() => {
        useAnnouncementStore.getState().showAnnouncement(announcementId);
      }, 500);
    }
  }, [hasSeenWelcome, addAnnouncement, setHasSeenWelcome, updateChecklistStep]);

  return null;
}