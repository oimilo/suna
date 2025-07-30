import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
  skipped?: boolean;
}

interface OnboardingStore {
  // Estado do onboarding
  hasSeenWelcome: boolean;
  hasCompletedTour: boolean;
  hasCreatedFirstProject: boolean;
  hasRunFirstCommand: boolean;
  tourStep: number;
  
  // Steps do checklist
  checklistSteps: OnboardingStep[];
  
  // Preferências do usuário
  userPreferences: {
    useCase?: 'coding' | 'writing' | 'analysis' | 'other';
    experience?: 'beginner' | 'intermediate' | 'expert';
  };
  
  // Actions
  setHasSeenWelcome: (seen: boolean) => void;
  setHasCompletedTour: (completed: boolean) => void;
  setHasCreatedFirstProject: (created: boolean) => void;
  setHasRunFirstCommand: (run: boolean) => void;
  setTourStep: (step: number) => void;
  updateChecklistStep: (stepId: string, completed: boolean) => void;
  setUserPreferences: (prefs: Partial<OnboardingStore['userPreferences']>) => void;
  
  // Utility functions
  resetOnboarding: () => void;
  skipOnboarding: () => void;
  isOnboardingComplete: () => boolean;
  
  // Dev mode controls
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

const initialChecklistSteps: OnboardingStep[] = [
  { id: 'welcome', title: 'Ver mensagem de boas-vindas', completed: false },
  { id: 'tour', title: 'Completar tour guiado', completed: false },
  { id: 'project', title: 'Criar primeiro projeto', completed: false },
  { id: 'chat', title: 'Iniciar primeira conversa', completed: false },
  { id: 'command', title: 'Executar primeiro comando', completed: false },
  { id: 'file', title: 'Criar ou editar um arquivo', completed: false },
];

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      hasSeenWelcome: false,
      hasCompletedTour: false,
      hasCreatedFirstProject: false,
      hasRunFirstCommand: false,
      tourStep: 0,
      checklistSteps: initialChecklistSteps,
      userPreferences: {},
      devMode: false,
      
      // Actions
      setHasSeenWelcome: (seen) => set({ hasSeenWelcome: seen }),
      setHasCompletedTour: (completed) => {
        set({ hasCompletedTour: completed });
        if (completed) {
          get().updateChecklistStep('tour', true);
        }
      },
      setHasCreatedFirstProject: (created) => {
        set({ hasCreatedFirstProject: created });
        if (created) {
          get().updateChecklistStep('project', true);
        }
      },
      setHasRunFirstCommand: (run) => {
        set({ hasRunFirstCommand: run });
        if (run) {
          get().updateChecklistStep('command', true);
        }
      },
      setTourStep: (step) => set({ tourStep: step }),
      
      updateChecklistStep: (stepId, completed) => set((state) => ({
        checklistSteps: state.checklistSteps.map(step =>
          step.id === stepId ? { ...step, completed } : step
        )
      })),
      
      setUserPreferences: (prefs) => set((state) => ({
        userPreferences: { ...state.userPreferences, ...prefs }
      })),
      
      setDevMode: (enabled) => set({ devMode: enabled }),
      
      // Utility functions
      resetOnboarding: () => {
        set({
          hasSeenWelcome: false,
          hasCompletedTour: false,
          hasCreatedFirstProject: false,
          hasRunFirstCommand: false,
          tourStep: 0,
          checklistSteps: initialChecklistSteps,
          userPreferences: {}
        });
      },
      
      skipOnboarding: () => {
        set({
          hasSeenWelcome: true,
          hasCompletedTour: true,
          hasCreatedFirstProject: true,
          hasRunFirstCommand: true,
          checklistSteps: initialChecklistSteps.map(step => ({ ...step, completed: true, skipped: true }))
        });
      },
      
      isOnboardingComplete: () => {
        const state = get();
        return state.checklistSteps.every(step => step.completed);
      }
    }),
    {
      name: 'onboarding-storage',
      // In dev mode, add ?reset=onboarding to URL to clear
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('reset') === 'onboarding' && state) {
            state.resetOnboarding();
            // Remove the param from URL
            urlParams.delete('reset');
            const newUrl = window.location.pathname + 
              (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, '', newUrl);
          }
        }
      }
    }
  )
);