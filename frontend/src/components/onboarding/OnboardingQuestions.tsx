'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/hooks/use-onboarding-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Sparkles, X } from 'lucide-react';

// Import das perguntas
import { ProfessionCards } from './questions/ProfessionCards';
import { ProjectSwipeCards } from './questions/ProjectSwipeCards';
import { PainPointChat } from './questions/PainPointChat';
import { TechLevelSlider } from './questions/TechLevelSlider';
import { ObjectiveSelection } from './questions/ObjectiveSelection';
import { PersonalityQuiz } from './questions/PersonalityQuiz';

export interface OnboardingAnswer {
  questionId: string;
  answer: any;
  timestamp: Date;
}

interface OnboardingQuestionsProps {
  onComplete: (answers: OnboardingAnswer[]) => void;
  onSkip?: () => void;
}

const QUESTIONS = [
  {
    id: 'profession',
    title: 'Quem é você no mundo digital?',
    subtitle: 'Isso nos ajuda a entender seu contexto',
    component: ProfessionCards,
    xpReward: 10
  },
  {
    id: 'project_type',
    title: 'O que você quer criar hoje?',
    subtitle: 'Deslize para escolher seu projeto ideal',
    component: ProjectSwipeCards,
    xpReward: 10
  },
  {
    id: 'pain_point',
    title: 'Me conta sua maior dor',
    subtitle: 'Vamos resolver isso juntos',
    component: PainPointChat,
    xpReward: 10
  },
  {
    id: 'tech_level',
    title: 'Qual seu nível ninja em tech?',
    subtitle: 'Para ajustarmos a complexidade',
    component: TechLevelSlider,
    xpReward: 10
  },
  {
    id: 'objective',
    title: 'Qual é seu objetivo principal?',
    subtitle: 'O que você quer alcançar?',
    component: ObjectiveSelection,
    xpReward: 10
  },
  {
    id: 'personality',
    title: 'Que tipo de criador você é?',
    subtitle: 'Última pergunta, prometo!',
    component: PersonalityQuiz,
    xpReward: 20
  }
];

export function OnboardingQuestions({ onComplete, onSkip }: OnboardingQuestionsProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { updateChecklistStep } = useOnboardingStore();
  
  console.log('[OnboardingQuestions] Component rendered!');

  const handleAnswer = (answer: any) => {
    const newAnswer: OnboardingAnswer = {
      questionId: QUESTIONS[currentQuestion].id,
      answer,
      timestamp: new Date()
    };

    setAnswers([...answers, newAnswer]);
    setTotalXP(totalXP + QUESTIONS[currentQuestion].xpReward);

    // Pequeno delay para mostrar feedback
    setIsAnimating(true);
    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Completou todas as perguntas
        const allAnswers = [...answers, newAnswer];
        
        // NÃO criar projeto aqui - será criado no PersonalityQuiz após o loader
        updateChecklistStep('questions', true);
        onComplete(allAnswers);
      }
      setIsAnimating(false);
    }, 500);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Remove última resposta
      setAnswers(answers.slice(0, -1));
      setTotalXP(totalXP - QUESTIONS[currentQuestion - 1].xpReward);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const CurrentQuestionComponent = QUESTIONS[currentQuestion].component;

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-background via-background to-purple-950/10 p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">{totalXP} XP</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Pergunta {currentQuestion + 1} de {QUESTIONS.length}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="hover:bg-red-500/10 hover:text-red-400"
            >
              <X className="h-4 w-4 mr-1" />
              Pular
            </Button>
          </div>
          
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Question Header */}
            <div className="text-center space-y-2">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold bg-gradient-to-r from-foreground to-purple-400 bg-clip-text text-transparent"
              >
                {QUESTIONS[currentQuestion].title}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground"
              >
                {QUESTIONS[currentQuestion].subtitle}
              </motion.p>
            </div>

            {/* Question Component */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <CurrentQuestionComponent 
                onAnswer={handleAnswer}
                disabled={isAnimating}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>

          {/* XP Animation */}
          <AnimatePresence>
            {isAnimating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-20"
              >
                <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
                  <span className="text-purple-400 font-bold">
                    +{QUESTIONS[currentQuestion].xpReward} XP!
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-sm text-muted-foreground">
            {currentQuestion === QUESTIONS.length - 1 ? (
              <span className="text-purple-400 font-medium">Última pergunta! 🎉</span>
            ) : (
              <span>Próxima pergunta em breve...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}