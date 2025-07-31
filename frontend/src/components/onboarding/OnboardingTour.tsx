'use client';

import dynamic from 'next/dynamic';
import { useOnboardingStore } from '@/hooks/use-onboarding-store';
import { useCallback, useEffect, useState } from 'react';
import { CallBackProps, STATUS, Step } from 'react-joyride';

// Dynamic import to avoid SSR issues
const JoyRideNoSSR = dynamic(
  () => import('react-joyride'),
  { ssr: false }
);

const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Bem-vindo ao Prophet! 🌞</h3>
        <p className="text-sm">Vou te mostrar rapidamente como usar o Prophet para realizar tarefas incríveis.</p>
        <div className="bg-primary/10 p-3 rounded-lg mt-3">
          <p className="text-xs font-medium">Este tour leva apenas 2 minutos!</p>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="new-chat-button"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">Nova Tarefa ✨</h3>
        <p className="text-sm">Clique aqui para iniciar uma nova conversa com o Prophet.</p>
        <p className="text-xs text-muted-foreground mt-2">Cada tarefa é salva automaticamente para você voltar depois!</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="model-selector"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">Seletor de Modelo 🤖</h3>
        <p className="text-sm">Escolha o modelo de IA ideal para sua tarefa.</p>
        <ul className="text-xs space-y-1 mt-2 text-muted-foreground">
          <li>• <strong>Kimi K2</strong>: Rápido e gratuito</li>
          <li>• <strong>Claude 4</strong>: O mais inteligente (PRO)</li>
          <li>• <strong>GPT-4</strong>: Versátil e poderoso (PRO)</li>
        </ul>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="message-input"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">Campo de Mensagem 💬</h3>
        <p className="text-sm">É aqui que você conversa com o Prophet!</p>
        <div className="bg-muted/50 p-2 rounded text-xs mt-2 font-mono">
          "Crie um site de vendas com formulário de contato"
        </div>
        <p className="text-xs text-muted-foreground mt-2">💡 Seja específico sobre o que precisa</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Pronto para começar! 🚀</h3>
        <p className="text-sm">Agora você já sabe o básico. Que tal fazer seu primeiro pedido ao Prophet?</p>
        <div className="space-y-2 mt-3">
          <p className="text-xs font-medium">Sugestões para começar:</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• "Crie uma página de apresentação profissional"</li>
            <li>• "Analise os dados deste arquivo CSV"</li>
            <li>• "Extraia informações do site exemplo.com"</li>
          </ul>
        </div>
      </div>
    ),
    placement: 'center',
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  const {
    hasSeenWelcome,
    hasCompletedTour,
    tourStep,
    setTourStep,
    setHasCompletedTour,
    updateChecklistStep,
  } = useOnboardingStore();

  // Check if critical elements exist
  const checkElementsExist = useCallback(() => {
    // Check for at least one critical element
    const newChatButton = document.querySelector('[data-tour="new-chat-button"]');
    const messageInput = document.querySelector('[data-tour="message-input"]');
    
    return newChatButton || messageInput;
  }, []);

  // Start tour when welcome is seen but tour not completed
  useEffect(() => {
    if (hasSeenWelcome && !hasCompletedTour) {
      // Add a delay to ensure DOM elements are rendered
      const startTour = () => {
        if (checkElementsExist() || retryCount >= 3) {
          setRun(true);
          setStepIndex(tourStep);
        } else {
          // Retry after a delay
          setRetryCount(prev => prev + 1);
        }
      };

      const timer = setTimeout(startTour, 500);
      
      return () => clearTimeout(timer);
    }
  }, [hasSeenWelcome, hasCompletedTour, tourStep, checkElementsExist, retryCount]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type, step } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    console.log('Tour callback:', { status, action, index, type, step: step?.target });

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setHasCompletedTour(true);
      updateChecklistStep('tour', true);
      onComplete?.();
    } else if (type === 'step:after') {
      // Update step index
      const nextIndex = index + (action === 'next' ? 1 : -1);
      setStepIndex(nextIndex);
      setTourStep(nextIndex);
    } else if (status === 'error') {
      console.error('Tour error:', data);
      // Try to continue to next step on error
      if (index < tourSteps.length - 1) {
        setStepIndex(index + 1);
        setTourStep(index + 1);
      }
    }
  }, [setHasCompletedTour, setTourStep, updateChecklistStep, onComplete]);

  // Don't render if tour is completed
  if (hasCompletedTour) {
    return null;
  }

  return (
    <JoyRideNoSSR
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      disableOverlay={false}
      disableScrolling={false}
      hideCloseButton={false}
      scrollToFirstStep={false}
      spotlightClicks={false}
      styles={{
        options: {
          primaryColor: '#F59E0B',
          textColor: '#374151',
          backgroundColor: '#FFFFFF',
          arrowColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '8px',
          padding: '16px',
        },
        tooltipContent: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#F59E0B',
          borderRadius: '6px',
          color: '#FFFFFF',
        },
        buttonBack: {
          color: '#374151',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#6B7280',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        open: 'Abrir',
        skip: 'Pular tour',
      }}
    />
  );
}