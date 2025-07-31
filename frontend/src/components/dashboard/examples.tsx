'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Bot,
  Briefcase,
  Settings,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Target,
  Brain,
  Globe,
  Heart,
  PenTool,
  Code,
  Camera,
  Calendar,
  DollarSign,
  Rocket,
} from 'lucide-react';

type PromptExample = {
  title: string;
  query: string;
  icon: React.ReactNode;
};

const allPrompts: PromptExample[] = [
  {
    title: 'Painel de pesquisa de mercado',
    query: 'Crie um painel abrangente de pesquisa de mercado analisando tendências do setor, segmentos de clientes e cenário competitivo. Inclua visualização de dados e recomendações acionáveis.',
    icon: <BarChart3 className="text-green-700 dark:text-green-400" size={16} />,
  },
  {
    title: 'Motor de recomendação',
    query: 'Desenvolva um motor de recomendação para sugestões personalizadas de produtos. Inclua filtragem colaborativa, filtragem baseada em conteúdo e abordagens híbridas com métricas de avaliação.',
    icon: <Bot className="text-blue-700 dark:text-blue-400" size={16} />,
  },
  {
    title: 'Estratégia de lançamento no mercado',
    query: 'Desenvolva uma estratégia abrangente de lançamento no mercado para um novo produto. Inclua dimensionamento do mercado, canais de aquisição de clientes, estratégia de preços e cronograma de lançamento.',
    icon: <Briefcase className="text-rose-700 dark:text-rose-400" size={16} />,
  },
  {
    title: 'Automação de pipeline de dados',
    query: 'Crie um pipeline de dados automatizado para processos ETL. Inclua validação de dados, tratamento de erros, monitoramento e design de arquitetura escalável.',
    icon: <Settings className="text-purple-700 dark:text-purple-400" size={16} />,
  },
  {
    title: 'Sistema de produtividade',
    query: 'Projete um sistema abrangente de produtividade pessoal incluindo gerenciamento de tarefas, acompanhamento de metas, formação de hábitos e bloqueio de tempo. Crie modelos e fluxos de trabalho para planejamento diário, semanal e mensal.',
    icon: <Target className="text-orange-700 dark:text-orange-400" size={16} />,
  },
  {
    title: 'Plano de marketing de conteúdo',
    query: 'Desenvolva uma estratégia de marketing de conteúdo de 6 meses incluindo posts de blog, mídias sociais, campanhas de e-mail e otimização SEO. Inclua calendário de conteúdo e métricas de desempenho.',
    icon: <PenTool className="text-indigo-700 dark:text-indigo-400" size={16} />,
  },
  {
    title: 'Análise de portfólio',
    query: 'Crie uma ferramenta de análise de portfólio de investimentos pessoais com avaliação de risco, recomendações de diversificação e acompanhamento de desempenho em relação aos benchmarks do mercado.',
    icon: <DollarSign className="text-emerald-700 dark:text-emerald-400" size={16} />,
  },
  {
    title: 'Mapa da jornada do cliente',
    query: 'Mapeie a jornada completa do cliente desde a conscientização até a defesa da marca. Inclua pontos de contato, pontos de dor, emoções e oportunidades de otimização em cada etapa.',
    icon: <Users className="text-cyan-700 dark:text-cyan-400" size={16} />,
  },
  {
    title: 'Framework de testes A/B',
    query: 'Projete um framework abrangente de testes A/B incluindo formação de hipóteses, cálculos de significância estatística e diretrizes de interpretação de resultados.',
    icon: <TrendingUp className="text-teal-700 dark:text-teal-400" size={16} />,
  },
  {
    title: 'Automação de revisão de código',
    query: 'Crie um sistema automatizado de revisão de código que verifique vulnerabilidades de segurança, problemas de desempenho e padrões de codificação. Inclua integração com pipelines CI/CD.',
    icon: <Code className="text-violet-700 dark:text-violet-400" size={16} />,
  },
  {
    title: 'Matriz de avaliação de riscos',
    query: 'Desenvolva um framework abrangente de avaliação de riscos para operações de negócios incluindo identificação de riscos, análise de probabilidade, avaliação de impacto e estratégias de mitigação.',
    icon: <Shield className="text-red-700 dark:text-red-400" size={16} />,
  },
  {
    title: 'Gerador de trilha de aprendizado',
    query: 'Crie um gerador de trilha de aprendizado personalizado que se adapte aos objetivos individuais, nível de habilidade atual e estilo de aprendizagem preferido. Inclua acompanhamento de progresso e recomendações de recursos.',
    icon: <Brain className="text-pink-700 dark:text-pink-400" size={16} />,
  },
  {
    title: 'Automação de mídias sociais',
    query: 'Projete um sistema de automação de mídias sociais incluindo agendamento de conteúdo, rastreamento de engajamento, otimização de hashtags e análise de desempenho em múltiplas plataformas.',
    icon: <Globe className="text-blue-600 dark:text-blue-300" size={16} />,
  },
  {
    title: 'Painel de monitoramento de saúde',
    query: 'Construa um painel abrangente de monitoramento de saúde integrando dados de fitness, registro nutricional, padrões de sono e registros médicos com insights acionáveis e definição de metas.',
    icon: <Heart className="text-red-600 dark:text-red-300" size={16} />,
  },
  {
    title: 'Automação de projetos',
    query: 'Crie um sistema inteligente de gerenciamento de projetos com atribuição automática de tarefas, acompanhamento de prazos, alocação de recursos e integração de comunicação da equipe.',
    icon: <Calendar className="text-amber-700 dark:text-amber-400" size={16} />,
  },
  {
    title: 'Otimizador de funil de vendas',
    query: 'Analise e otimize todo o funil de vendas desde a geração de leads até a conversão. Inclua pontuação de leads, sequências de nutrição e estratégias de otimização de taxa de conversão.',
    icon: <Zap className="text-yellow-600 dark:text-yellow-300" size={16} />,
  },
  {
    title: 'Apresentação para investidores',
    query: 'Gere uma apresentação convincente para investidores incluindo declaração do problema, visão geral da solução, análise de mercado, modelo de negócios, projeções financeiras e requisitos de financiamento.',
    icon: <Rocket className="text-orange-600 dark:text-orange-300" size={16} />,
  },
  {
    title: 'Fluxo de trabalho fotográfico',
    query: 'Projete um fluxo de trabalho fotográfico completo incluindo planejamento de sessões, organização de arquivos, presets de edição, entrega ao cliente e sistemas de gerenciamento de portfólio.',
    icon: <Camera className="text-slate-700 dark:text-slate-400" size={16} />,
  },
  {
    title: 'Análise da cadeia de suprimentos',
    query: 'Crie uma análise de otimização da cadeia de suprimentos incluindo avaliação de fornecedores, oportunidades de redução de custos, mitigação de riscos e estratégias de gerenciamento de estoque.',
    icon: <Briefcase className="text-stone-700 dark:text-stone-400" size={16} />,
  },
  {
    title: 'Framework de pesquisa UX',
    query: 'Desenvolva um framework abrangente de pesquisa UX incluindo entrevistas com usuários, testes de usabilidade, desenvolvimento de personas e recomendações de design baseadas em dados.',
    icon: <Sparkles className="text-fuchsia-700 dark:text-fuchsia-400" size={16} />,
  },
];

// Function to get random prompts
const getRandomPrompts = (count: number = 3): PromptExample[] => {
  const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const Examples = ({
  onSelectPrompt,
}: {
  onSelectPrompt?: (query: string) => void;
}) => {
  const [displayedPrompts, setDisplayedPrompts] = useState<PromptExample[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize with random prompts on mount
  useEffect(() => {
    setDisplayedPrompts(getRandomPrompts(3));
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setDisplayedPrompts(getRandomPrompts(3));
    setTimeout(() => setIsRefreshing(false), 300);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="group relative">
        <div className="flex gap-2 justify-center py-2">
          {displayedPrompts.map((prompt, index) => (
            <motion.div
              key={`${prompt.title}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: index * 0.03,
                ease: "easeOut"
              }}
            >
              <Button
                variant="outline"
                className="w-fit h-fit px-3 py-2 rounded-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-sm font-normal text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onSelectPrompt && onSelectPrompt(prompt.query)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {React.cloneElement(prompt.icon as React.ReactElement, { size: 14 })}
                  </div>
                  <span className="whitespace-nowrap">{prompt.title}</span>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Refresh button that appears on hover */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="absolute -top-4 right-1 h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <RefreshCw size={10} className="text-muted-foreground" />
          </motion.div>
        </Button>
      </div>
    </div>
  );
};