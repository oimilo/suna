'use client';

import { useState, useRef } from 'react';
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
    id: 'main_goal',
    question: 'Qual é seu objetivo principal?',
    options: [
      { id: 'showcase', icon: Eye, text: 'Mostrar meu trabalho/empresa', trait: 'showcase' },
      { id: 'build', icon: Brain, text: 'Desenvolver aplicações', trait: 'build' },
      { id: 'analyze', icon: Sparkles, text: 'Analisar dados e métricas', trait: 'analyze' },
      { id: 'automate', icon: Zap, text: 'Automatizar processos', trait: 'automate' }
    ]
  },
  {
    id: 'project_type',
    question: 'Que tipo de projeto você quer criar?',
    options: [
      { id: 'website', icon: Palette, text: 'Site ou landing page', trait: 'website' },
      { id: 'store', icon: Brush, text: 'Loja online', trait: 'store' },
      { id: 'content', icon: Wrench, text: 'Blog ou conteúdo', trait: 'content' },
      { id: 'game', icon: Gamepad2, text: 'Jogo ou entretenimento', trait: 'game' }
    ]
  },
  {
    id: 'work_style',
    question: 'Como você prefere trabalhar?',
    options: [
      { id: 'visual', icon: Layers, text: 'Foco no visual e design', trait: 'visual' },
      { id: 'technical', icon: Workflow, text: 'Foco na parte técnica', trait: 'technical' }
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
  // Website + Showcase = Landing Page Designer
  'website-showcase': {
    id: 'website-showcase',
    title: '🎨 Landing Page Designer',
    icon: Eye,
    description: 'Você cria páginas impressionantes para mostrar trabalhos e empresas!',
    traits: ['Visual', 'Marketing', 'Design'],
    color: 'from-blue-400 to-purple-400'
  },
  // Website + Geral = Web Developer
  'website-general': {
    id: 'website-general',
    title: '🌐 Web Developer',
    icon: Palette,
    description: 'Você constrói sites funcionais e atraentes para diversos propósitos!',
    traits: ['Frontend', 'UX', 'Responsivo'],
    color: 'from-cyan-400 to-blue-400'
  },
  // E-commerce = E-commerce Specialist
  'ecommerce': {
    id: 'ecommerce',
    title: '🛒 E-commerce Specialist',
    icon: Brush,
    description: 'Você domina vendas online e conversões. Cada clique é uma oportunidade!',
    traits: ['Vendas', 'Conversão', 'UX'],
    color: 'from-emerald-400 to-green-400'
  },
  // Content Visual = Content Creator
  'content-visual': {
    id: 'content-visual',
    title: '📝 Content Creator',
    icon: Wrench,
    description: 'Você cria conteúdo visual impactante. Storytelling é sua especialidade!',
    traits: ['Conteúdo', 'Visual', 'Storytelling'],
    color: 'from-pink-400 to-rose-400'
  },
  // Content Technical = Technical Writer
  'content-technical': {
    id: 'content-technical',
    title: '💻 Technical Writer',
    icon: Brain,
    description: 'Você documenta e explica tecnologia de forma clara e acessível!',
    traits: ['Técnico', 'Documentação', 'APIs'],
    color: 'from-green-400 to-teal-400'
  },
  // Game = Game Developer
  'game': {
    id: 'game',
    title: '🎮 Game Developer',
    icon: Gamepad2,
    description: 'Você cria experiências lúdicas e envolventes. Diversão é o objetivo!',
    traits: ['Criativo', 'Interativo', 'Lúdico'],
    color: 'from-purple-400 to-pink-400'
  },
  // Analytics = Data Analyst
  'analytics': {
    id: 'analytics',
    title: '📊 Data Analyst',
    icon: Sparkles,
    description: 'Você transforma dados em insights. Números contam histórias!',
    traits: ['Dados', 'Insights', 'Métricas'],
    color: 'from-amber-400 to-orange-400'
  },
  // Automation = Automation Engineer
  'automation': {
    id: 'automation',
    title: '🤖 Automation Engineer',
    icon: Workflow,
    description: 'Você automatiza tarefas repetitivas. Eficiência é sua obsessão!',
    traits: ['Automação', 'Produtividade', 'Sistemas'],
    color: 'from-violet-400 to-purple-400'
  },
  // Developer = Full Stack Developer
  'developer': {
    id: 'developer',
    title: '⚡ Full Stack Developer',
    icon: Layers,
    description: 'Você constrói aplicações completas do zero. Backend e frontend!',
    traits: ['Full Stack', 'APIs', 'Sistemas'],
    color: 'from-orange-400 to-yellow-400'
  }
};

interface PersonalityQuizProps {
  onAnswer?: (answer: any) => void;  // Tornando opcional já que não usamos mais
  disabled?: boolean;
}

export function PersonalityQuiz({ disabled }: Omit<PersonalityQuizProps, 'onAnswer'>) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user, supabase } = useAuth();
  const router = useRouter();
  const createTemplateProject = useCreateTemplateProject();
  const hasCreatedProject = useRef(false);

  const handleSelectOption = (_optionId: string, trait: string) => {
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
      
      // Mostra o resultado da personalidade por 4 segundos, depois o loader
      setTimeout(() => {
        setShowLoader(true);
        // Marcar o tempo de início do loader
        (window as any).loaderStartTime = Date.now();
        
        // Criar o projeto quando o loader começar (uma única vez)
        if (user?.id && !hasCreatedProject.current) {
          hasCreatedProject.current = true;
          
          // Usar a função getPersonalityResult para obter o perfil correto
          const correctPersonality = getPersonalityResult();
          
          console.log('[PersonalityQuiz] Criando projeto template com:', {
            userId: user.id,
            profileType: correctPersonality?.id || 'website-general',
            answers: newAnswers
          });
          
          createTemplateProject.mutate({
            userId: user.id,
            profileType: correctPersonality?.id || 'website-general',
            onboardingAnswers: newAnswers
          }, {
            onSuccess: async (data) => {
              console.log('[PersonalityQuiz] Projeto criado com sucesso:', data);
              
              // Calcular tempo restante do loader (mínimo 15 segundos total para garantir criação completa)
              const elapsedTime = Date.now() - (window as any).loaderStartTime;
              const remainingTime = Math.max(3000, 15000 - elapsedTime); // Mínimo 3 segundos de espera

              try {
                await supabase.auth.updateUser({
                  data: {
                    onboarding_completed: true,
                    onboarding_completed_at: new Date().toISOString(),
                    onboarding_project_id: data.projectId,
                  },
                });
              } catch (metadataError) {
                console.error('[PersonalityQuiz] Erro ao atualizar metadados de onboarding:', metadataError);
              }
              
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
    // Nova lógica: usar goal + type para mapeamento direto
    const goal = answers.main_goal;
    const type = answers.project_type;
    const style = answers.work_style;
    
    // Mapeamento mais intuitivo baseado nas respostas
    let profileType = '';
    
    if (type === 'website' && goal === 'showcase') profileType = 'website-showcase';
    else if (type === 'website') profileType = 'website-general';
    else if (type === 'store') profileType = 'ecommerce';
    else if (type === 'content' && style === 'visual') profileType = 'content-visual';
    else if (type === 'content') profileType = 'content-technical';
    else if (type === 'game') profileType = 'game';
    else if (goal === 'analyze') profileType = 'analytics';
    else if (goal === 'automate') profileType = 'automation';
    else if (goal === 'build' && style === 'technical') profileType = 'developer';
    else profileType = 'website-general'; // fallback
    
    return PERSONALITY_TYPES[profileType] || PERSONALITY_TYPES['website-general'];
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