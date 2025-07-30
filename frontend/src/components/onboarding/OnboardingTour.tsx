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
    target: '.project-selector',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">Bem-vindo ao Prophet! 🌞</h3>
        <p>Aqui você gerencia seus projetos. Cada projeto tem suas próprias conversas e arquivos.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="new-chat-button"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">Iniciar Nova Conversa</h3>
        <p>Clique aqui para começar uma nova conversa com o Prophet. Você pode pedir para criar código, analisar dados, ou qualquer outra tarefa!</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="model-selector"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">Escolha seu Modelo de IA</h3>
        <p>Diferentes modelos têm diferentes capacidades. O Claude 4 é ótimo para tarefas complexas, enquanto modelos menores são mais rápidos.</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="workspace-toggle"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">Área de Trabalho</h3>
        <p>Clique aqui para ver a área de trabalho do Prophet. Você verá em tempo real os arquivos sendo criados e comandos executados!</p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="message-input"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">Converse com o Prophet</h3>
        <p>Digite sua mensagem aqui. Você pode pedir para criar sites, analisar código, gerar imagens e muito mais!</p>
        <p className="text-sm text-muted-foreground">Dica: Use Shift+Enter para quebrar linha</p>
      </div>
    ),
    placement: 'top',
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  
  const {
    hasSeenWelcome,
    hasCompletedTour,
    tourStep,
    setTourStep,
    setHasCompletedTour,
    updateChecklistStep,
  } = useOnboardingStore();

  // Start tour when welcome is seen but tour not completed
  useEffect(() => {
    if (hasSeenWelcome && !hasCompletedTour) {
      setRun(true);
      setStepIndex(tourStep);
    }
  }, [hasSeenWelcome, hasCompletedTour, tourStep]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setHasCompletedTour(true);
      updateChecklistStep('tour', true);
      onComplete?.();
    } else if (type === 'step:after') {
      // Update step index
      setStepIndex(index + (action === 'next' ? 1 : -1));
      setTourStep(index);
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