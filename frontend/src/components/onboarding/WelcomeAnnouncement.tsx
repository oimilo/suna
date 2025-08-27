'use client';

import { useEffect } from 'react';
import { useAnnouncementStore } from '@/hooks/use-announcement-store';
import { useOnboardingStore } from '@/hooks/use-onboarding-store';

export function WelcomeAnnouncement() {
  const { addAnnouncement } = useAnnouncementStore();
  const { 
    hasSeenWelcome, 
    setHasSeenWelcome, 
    updateChecklistStep,
    setTourStep
  } = useOnboardingStore();


  useEffect(() => {
    // Verificar se o onboarding já foi completado
    const isCompleted = localStorage.getItem('onboarding_completed') === 'true';
    
    // Only show once and if not completed
    if (!hasSeenWelcome && !isCompleted) {
      const announcementId = addAnnouncement({
        type: 'onboarding',
        title: 'Bem-vindo ao Prophet! 🌞',
        description: 'Seu assistente de IA para tarefas do mundo real',
        priority: 'high',
        persistent: false,
        htmlContent: `
          <div class="space-y-4">
            <div class="space-y-3">
              <p class="text-sm">
                Sou um agente de IA que pode executar tarefas reais para você através de uma conversa simples.
              </p>
              
              <div class="space-y-2 text-sm">
                <p class="font-medium">Posso ajudar você com:</p>
                <ul class="space-y-1 text-xs text-muted-foreground">
                  <li>📄 <span class="font-medium">Criar e editar arquivos</span> - documentos, código, planilhas</li>
                  <li>🌐 <span class="font-medium">Navegar e extrair dados da web</span> - pesquisas, análises</li>
                  <li>🚀 <span class="font-medium">Deploy de sites</span> - publicar projetos online</li>
                  <li>💻 <span class="font-medium">Executar comandos</span> - automatizar tarefas</li>
                  <li>🔗 <span class="font-medium">Conectar com seus apps favoritos</span> - Gmail, Slack, etc</li>
                </ul>
              </div>
              
              <div class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <p class="text-sm font-medium">💡 Dica rápida</p>
                <p class="text-xs text-muted-foreground mt-1">
                  Você pode me pedir coisas como: "Crie um site portfolio", "Extraia dados deste site", 
                  "Analise estes arquivos", "Faça deploy desta aplicação"
                </p>
              </div>
            </div>
          </div>
        `,
        actions: [
          {
            id: 'start-tour',
            label: '🚀 Vamos lá!',
            variant: 'default',
            onClick: () => {
              console.log('[WelcomeAnnouncement] Vamos lá clicked!');
              
              // Close the announcement dialog first
              useAnnouncementStore.getState().closeDialog();
              
              // Then set the onboarding states
              setHasSeenWelcome(true);
              updateChecklistStep('welcome', true);
              
              // Start the onboarding tour with questions
              setTourStep(0);
              console.log('[WelcomeAnnouncement] tourStep set to 0, dialog closed');
            }
          },
          {
            id: 'skip',
            label: 'Já conheço o Prophet',
            variant: 'outline',
            onClick: () => {
              // Close the announcement dialog
              useAnnouncementStore.getState().closeDialog();
              
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
  }, [hasSeenWelcome, addAnnouncement, setHasSeenWelcome, updateChecklistStep, setTourStep]);

  return null;
}