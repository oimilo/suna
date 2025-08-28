'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Brain, 
  Sparkles, 
  Zap, 
  Palette,
  Brush,
  Wrench,
  Layers,
  Lightbulb,
  Loader2,
  CheckCircle,
  Shield,
  Plug,
  MessageSquare,
  Gamepad2,
  Workflow
} from 'lucide-react';
// Testando versão simples temporariamente
import { useCreateTemplateProjectSimple as useCreateTemplateProject } from '@/lib/onboarding/use-create-template-project-simple';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/hooks/use-onboarding-store';

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    icon: any;
    text: string;
    trait: string;
  }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'work_style',
    question: 'Você prefere trabalhar...',
    options: [
      { id: 'visual', icon: Eye, text: 'Vendo o resultado visual', trait: 'visual' },
      { id: 'logical', icon: Brain, text: 'Entendendo a lógica', trait: 'logical' }
    ]
  },
  {
    id: 'project_ideal',
    question: 'Seu projeto ideal é...',
    options: [
      { id: 'beautiful', icon: Sparkles, text: 'Bonito e impressionante', trait: 'aesthetic' },
      { id: 'functional', icon: Zap, text: 'Rápido e funcional', trait: 'pragmatic' }
    ]
  },
  {
    id: 'project_type',
    question: 'O que você mais gosta de criar?',
    options: [
      { id: 'interactive', icon: Gamepad2, text: 'Experiências interativas', trait: 'interactive' },
      { id: 'automated', icon: Workflow, text: 'Processos automatizados', trait: 'automated' }
    ]
  }
];

interface PersonalityType {
  id: string;
  title: string;
  icon: any;
  description: string;
  traits: string[];
  color: string;
}

const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  // Visual + Aesthetic + Interactive = Game Designer
  'visual-aesthetic-interactive': {
    id: 'visual-aesthetic-interactive',
    title: '🎮 Game Designer',
    icon: Gamepad2,
    description: 'Você cria experiências visuais interativas e envolventes. Jogos são sua paixão!',
    traits: ['Criativo', 'Interativo', 'Visual'],
    color: 'from-purple-400 to-pink-400'
  },
  // Visual + Aesthetic + Automated = Artista Visual
  'visual-aesthetic-automated': {
    id: 'visual-aesthetic-automated',
    title: '🎨 Artista Visual',
    icon: Brush,
    description: 'Você automatiza a criação de beleza. Design systems e templates são sua arte!',
    traits: ['Design', 'Automação', 'Estética'],
    color: 'from-pink-400 to-rose-400'
  },
  // Visual + Pragmatic + Interactive = UX Developer
  'visual-pragmatic-interactive': {
    id: 'visual-pragmatic-interactive',
    title: '🎯 UX Developer',
    icon: Eye,
    description: 'Você cria interfaces funcionais e interativas. User experience é tudo!',
    traits: ['UX', 'Funcional', 'Interativo'],
    color: 'from-blue-400 to-purple-400'
  },
  // Visual + Pragmatic + Automated = Growth Hacker
  'visual-pragmatic-automated': {
    id: 'visual-pragmatic-automated',
    title: '📈 Growth Hacker',
    icon: Zap,
    description: 'Você automatiza conversões e otimiza resultados visuais. Marketing automation!',
    traits: ['Conversão', 'Automação', 'Visual'],
    color: 'from-cyan-400 to-blue-400'
  },
  // Logical + Aesthetic + Interactive = Full Stack Developer
  'logical-aesthetic-interactive': {
    id: 'logical-aesthetic-interactive',
    title: '💻 Full Stack Developer',
    icon: Layers,
    description: 'Você constrói aplicações completas e elegantes. Do backend ao frontend!',
    traits: ['Full Stack', 'Elegante', 'Apps'],
    color: 'from-green-400 to-teal-400'
  },
  // Logical + Aesthetic + Automated = Arquiteto de Sistemas
  'logical-aesthetic-automated': {
    id: 'logical-aesthetic-automated',
    title: '🏗️ Arquiteto de Sistemas',
    icon: Workflow,
    description: 'Você projeta sistemas automatizados e bem estruturados. Arquitetura é arte!',
    traits: ['Arquitetura', 'Automação', 'Elegância'],
    color: 'from-emerald-400 to-green-400'
  },
  // Logical + Pragmatic + Interactive = Backend Developer
  'logical-pragmatic-interactive': {
    id: 'logical-pragmatic-interactive',
    title: '⚡ Backend Developer',
    icon: Lightbulb,
    description: 'Você cria APIs e serviços rápidos e eficientes. Performance é prioridade!',
    traits: ['Backend', 'Performance', 'APIs'],
    color: 'from-orange-400 to-yellow-400'
  },
  // Logical + Pragmatic + Automated = Automation Engineer
  'logical-pragmatic-automated': {
    id: 'logical-pragmatic-automated',
    title: '🤖 Automation Engineer',
    icon: Workflow,
    description: 'Você automatiza tudo que pode. Eficiência máxima com mínimo esforço!',
    traits: ['Automação', 'Eficiência', 'Processos'],
    color: 'from-red-400 to-orange-400'
  }
};

interface PersonalityQuizProps {
  onAnswer?: (answer: any) => void;  // Tornando opcional já que não usamos mais
  disabled?: boolean;
}

export function PersonalityQuiz({ onAnswer, disabled }: PersonalityQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const createTemplateProject = useCreateTemplateProject();
  const hasCreatedProject = useRef(false);

  const handleSelectOption = (optionId: string, trait: string) => {
    if (disabled) return;

    const newAnswers = {
      ...answers,
      [QUIZ_QUESTIONS[currentQuestion].id]: trait
    };
    setAnswers(newAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      // Next question
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      // Show result
      setShowResult(true);
      const personalityKey = `${newAnswers.work_style}-${newAnswers.project_ideal}-${newAnswers.project_type}`;
      const personality = PERSONALITY_TYPES[personalityKey];
      
      // Mostra o resultado da personalidade por 4 segundos, depois o loader
      setTimeout(() => {
        setShowLoader(true);
        // Marcar o tempo de início do loader
        (window as any).loaderStartTime = Date.now();
        
        // Criar o projeto quando o loader começar (uma única vez)
        if (user?.id && !hasCreatedProject.current) {
          hasCreatedProject.current = true;
          
          console.log('[PersonalityQuiz] Criando projeto template com:', {
            userId: user.id,
            profileType: personality.id,
            answers: newAnswers
          });
          
          createTemplateProject.mutate({
            userId: user.id,
            profileType: personality.id,
            onboardingAnswers: newAnswers
          }, {
            onSuccess: (data) => {
              console.log('[PersonalityQuiz] Projeto criado com sucesso:', data);
              
              // Calcular tempo restante do loader (mínimo 15 segundos total para garantir criação completa)
              const elapsedTime = Date.now() - (window as any).loaderStartTime;
              const remainingTime = Math.max(3000, 15000 - elapsedTime); // Mínimo 3 segundos de espera
              
              // Redirecionar direto para o projeto quando o loader terminar
              setTimeout(() => {
                // Limpar TODO o estado do onboarding completamente
                const store = useOnboardingStore.getState();
                
                // Marcar onboarding como completo
                store.setHasSeenWelcome(true);
                store.setTourStep(-1);
                store.updateChecklistStep('welcome', true);
                store.updateChecklistStep('questions', true);
                store.updateChecklistStep('project', true); // Marcar projeto como criado também
                
                // Salvar no localStorage que o onboarding foi completado
                localStorage.setItem('onboarding_completed', 'true');
                localStorage.setItem('onboarding_project_id', data.projectId);
                
                // Redirecionar para o projeto
                window.location.href = `/projects/${data.projectId}/thread/${data.threadId}`;
              }, remainingTime);
            },
            onError: (error) => {
              console.error('[PersonalityQuiz] Erro ao criar projeto:', error);
              // Redirecionar para dashboard em caso de erro
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 2000);
            }
          });
        }
        
        // Inicia a progressão dos passos do loader
        const stepInterval = setInterval(() => {
          setCurrentStep(prev => {
            if (prev >= 3) {
              clearInterval(stepInterval);
              // Não finaliza o onboarding aqui - apenas mantém o loader rodando
              // O redirecionamento será feito quando o projeto for criado
              return prev;
            }
            return prev + 1;
          });
        }, 3000); // Cada passo dura 3 segundos (total 12s)
      }, 4000);
    }
  };

  const getPersonalityResult = () => {
    const key = `${answers.work_style}-${answers.project_ideal}-${answers.project_type}`;
    return PERSONALITY_TYPES[key] || PERSONALITY_TYPES['visual-aesthetic-interactive'];
  };

  // Definir os passos do loader
  const loaderSteps = [
    {
      icon: Sparkles,
      title: 'Preparando seu projeto personalizado',
      description: 'Criando um template feito especialmente para o seu perfil',
      color: 'text-purple-400'
    },
    {
      icon: MessageSquare,
      title: 'Você terá controle total',
      description: 'Continue a interação e leve para qualquer direção que desejar',
      color: 'text-blue-400'
    },
    {
      icon: Plug,
      title: 'Integre suas ferramentas favoritas',
      description: 'Conecte qualquer ferramenta com linguagem natural',
      color: 'text-green-400'
    },
    {
      icon: Shield,
      title: 'Segurança em primeiro lugar',
      description: 'Suas credenciais protegidas com permissões granulares',
      color: 'text-amber-400'
    }
  ];

  if (showResult) {
    const personality = getPersonalityResult();
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        {!showLoader ? (
          <div className={`
            relative p-8 rounded-2xl text-center
            bg-gradient-to-br ${personality?.color || 'from-purple-400 to-pink-400'}
            text-white shadow-2xl
          `}>
            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-4 left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            {/* Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  damping: 10,
                  delay: 0.2
                }}
                className="mb-4"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur p-4 flex items-center justify-center">
                  {personality?.icon && <personality.icon className="w-full h-full text-white" />}
                </div>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-3"
              >
                Você é um {personality?.title || 'Game Designer'}!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 mb-6"
              >
                {personality?.description || 'Você cria experiências visuais interativas e envolventes.'}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {(personality?.traits || []).map((trait, index) => (
                  <motion.span
                    key={trait}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium"
                  >
                    {trait}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Loader Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <Loader2 className="w-full h-full text-purple-400" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Preparando sua experiência</h3>
              <p className="text-sm text-muted-foreground">
                Configurando tudo para você começar com o pé direito
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {loaderSteps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const Icon = step.icon;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: isActive || isCompleted ? 1 : 0.3,
                      x: 0
                    }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      flex items-start gap-4 p-4 rounded-lg
                      ${isActive ? 'bg-purple-500/10 border border-purple-500/20' : ''}
                      ${isCompleted ? 'opacity-100' : ''}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center shrink-0
                      ${isActive ? 'bg-purple-500/20' : 'bg-muted/50'}
                      ${isCompleted ? 'bg-green-500/20' : ''}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Icon className={`w-5 h-5 ${step.color}`} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`
                        font-medium text-sm mb-1
                        ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                      `}>
                        {step.title}
                      </h4>
                      <p className={`
                        text-xs
                        ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'}
                      `}>
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStep + 1) / loaderSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex justify-center gap-2 mb-8">
        {QUIZ_QUESTIONS.map((_, index) => (
          <motion.div
            key={index}
            initial={{ width: 8 }}
            animate={{ 
              width: index <= currentQuestion ? 40 : 8,
              backgroundColor: index <= currentQuestion ? '#a855f7' : '#374151'
            }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="text-center"
        >
          <h3 className="text-xl font-semibold mb-8">{question.question}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => {
              const Icon = option.icon;
              
              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectOption(option.id, option.trait)}
                  disabled={disabled}
                  className={`
                    p-6 rounded-xl border-2 transition-all
                    bg-background hover:bg-purple-500/5
                    border-border hover:border-purple-500/50
                    group relative overflow-hidden
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
                  
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="font-medium">{option.text}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}