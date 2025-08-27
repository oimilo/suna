'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Heart, 
  X, 
  Globe, 
  Bot, 
  BarChart3, 
  ShoppingCart, 
  Link2, 
  Smartphone,
  RefreshCw,
  Lightbulb,
  HelpCircle
} from 'lucide-react';

interface ProjectType {
  id: string;
  icon: any;
  title: string;
  description: string;
  examples: string[];
  color: string;
}

const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'website',
    icon: Globe,
    title: 'Site que Impressiona',
    description: 'Landing pages, portfolios, blogs',
    examples: ['Landing Page', 'Portfolio', 'Blog', 'Institucional'],
    color: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'automation',
    icon: Bot,
    title: 'Automação Inteligente',
    description: 'Automatize tarefas repetitivas',
    examples: ['Email Auto', 'Workflows', 'Scrapers', 'Bots'],
    color: 'from-purple-400 to-pink-400'
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    title: 'Dashboard de Dados',
    description: 'Visualize métricas e KPIs',
    examples: ['Analytics', 'Relatórios', 'BI', 'Métricas'],
    color: 'from-green-400 to-emerald-400'
  },
  {
    id: 'ecommerce',
    icon: ShoppingCart,
    title: 'Loja Online',
    description: 'Venda produtos na internet',
    examples: ['E-commerce', 'Marketplace', 'Catálogo', 'Checkout'],
    color: 'from-orange-400 to-red-400'
  },
  {
    id: 'api',
    icon: Link2,
    title: 'API/Backend',
    description: 'Serviços e integrações',
    examples: ['REST API', 'GraphQL', 'Webhooks', 'Microserviços'],
    color: 'from-indigo-400 to-purple-400'
  },
  {
    id: 'mobile',
    icon: Smartphone,
    title: 'App Mobile',
    description: 'Aplicativo para celular',
    examples: ['PWA', 'React Native', 'Flutter', 'Responsivo'],
    color: 'from-pink-400 to-rose-400'
  }
];

interface ProjectSwipeCardsProps {
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function ProjectSwipeCards({ onAnswer, disabled }: ProjectSwipeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (disabled || currentIndex >= PROJECT_TYPES.length) return;

    setExitDirection(direction);
    
    if (direction === 'right') {
      // Usuário gostou deste projeto
      onAnswer(PROJECT_TYPES[currentIndex].id);
    } else {
      // Próximo card
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setExitDirection(null);
      }, 300);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      handleSwipe('right');
    } else if (info.offset.x < -swipeThreshold) {
      handleSwipe('left');
    }
  };

  if (currentIndex >= PROJECT_TYPES.length) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Hmm, nenhum desses? Vamos tentar outra abordagem...
          </p>
          <p className="text-sm text-muted-foreground">
            Escolha uma das opções abaixo:
          </p>
        </div>
        
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setExitDirection(null);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Ver opções novamente
          </button>
          
          <button
            onClick={() => onAnswer('custom')}
            className="px-6 py-3 rounded-xl border-2 border-purple-500/50 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Tenho algo diferente em mente
          </button>
          
          <button
            onClick={() => onAnswer('not_sure')}
            className="px-6 py-3 rounded-xl border-2 border-border hover:bg-muted/50 transition-all text-muted-foreground flex items-center justify-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Ainda não sei bem
          </button>
        </div>
      </div>
    );
  }

  const currentProject = PROJECT_TYPES[currentIndex];

  return (
    <div className="relative h-[500px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProject.id}
          className="absolute w-full max-w-sm cursor-grab active:cursor-grabbing"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            rotate: 0
          }}
          exit={{
            x: exitDirection === 'left' ? -300 : exitDirection === 'right' ? 300 : 0,
            opacity: 0,
            rotate: exitDirection === 'left' ? -20 : exitDirection === 'right' ? 20 : 0,
            transition: { duration: 0.3 }
          }}
          drag={!disabled}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.05 }}
        >
          <div className="bg-gradient-to-br from-background via-background to-purple-950/20 border-2 border-border rounded-2xl p-8 shadow-xl">
            {/* Card Header */}
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${currentProject.color} p-4 flex items-center justify-center`}>
                <currentProject.icon className="w-full h-full text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{currentProject.title}</h2>
              <p className="text-muted-foreground">{currentProject.description}</p>
            </div>

            {/* Examples */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {currentProject.examples.map((example) => (
                <span 
                  key={example}
                  className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs"
                >
                  {example}
                </span>
              ))}
            </div>

            {/* Swipe Hints */}
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-red-400">
                <X className="h-4 w-4" />
                <span>Não é isso</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>É isso!</span>
                <Heart className="h-4 w-4" />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons (Alternative to swipe on desktop) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4">
        <button
          onClick={() => handleSwipe('left')}
          disabled={disabled}
          className="w-14 h-14 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <X className="h-6 w-6 text-red-400" />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          disabled={disabled}
          className="w-14 h-14 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center hover:bg-green-500/20 transition-colors disabled:opacity-50"
        >
          <Heart className="h-6 w-6 text-green-400" />
        </button>
      </div>

      {/* Cards Stack Preview */}
      <div className="absolute inset-0 -z-10">
        {PROJECT_TYPES.slice(currentIndex + 1, currentIndex + 3).map((project, index) => (
          <div
            key={project.id}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
            style={{
              transform: `translateX(-50%) translateY(-50%) scale(${0.95 - index * 0.05}) translateY(${index * 10}px)`,
              opacity: 0.5 - index * 0.2,
              zIndex: -index - 1
            }}
          >
            <div className="bg-background/50 border border-border/50 rounded-2xl h-[400px]" />
          </div>
        ))}
      </div>
    </div>
  );
}