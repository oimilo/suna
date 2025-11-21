'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Terminal,
  ChevronDown,
  Brain,
  FileCode,
  Globe,
  Globe2,
  BarChart3,
  Link2,
  Check,
  Lightbulb,
  Search,
  FileText,
  Table,
  MessageSquare,
  Database,
  FileDown,
  Send,
  Bot,
  Users,
  Code,
  GitBranch,
  Cloud,
  Bell,
  Activity,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

// Main feature categories with expandable details
const featureCategories = [
  {
    icon: Brain,
    title: 'Inteligência Avançada',
    brief: 'Modelos com contexto profundo',
    details: [
      'Entende requisitos complexos e ambíguos',
      'Mantém contexto de conversas longas',
      'Aprende com suas preferências',
      'Sugere melhorias proativamente'
    ],
    gradient: 'from-purple-600/20 to-violet-600/20'
  },
  {
    icon: Globe,
    title: 'Automação Web',
    brief: 'Navega e extrai dados de qualquer site',
    details: [
      'Browser automation completo',
      'Web scraping inteligente',
      'Preenchimento de formulários',
      'Extração de dados estruturados',
      'Navegação em sites com autenticação'
    ],
    gradient: 'from-violet-600/20 to-purple-600/20'
  },
  {
    icon: FileCode,
    title: 'Desenvolvimento Full-Stack',
    brief: 'Cria aplicações completas do zero',
    details: [
      'React, Next.js, Vue, Angular',
      'Node.js, Python, FastAPI',
      'PostgreSQL, MongoDB, Redis',
      'APIs REST e GraphQL',
      'Deploy em Vercel, Netlify, Railway'
    ],
    gradient: 'from-purple-600/20 to-pink-600/20'
  },
  {
    icon: BarChart3,
    title: 'Análise de Dados',
    brief: 'Pesquisa, analisa e gera relatórios',
    details: [
      'Análise competitiva de mercado',
      'Geração de relatórios PDF/Excel',
      'Visualização de dados',
      'Pesquisa em múltiplas fontes',
      'Cross-referencing de informações'
    ],
    gradient: 'from-pink-600/20 to-purple-600/20'
  },
  {
    icon: Terminal,
    title: 'Execução de Comandos',
    brief: 'Acesso completo ao terminal e sistema',
    details: [
      'Execução de scripts Python/Node',
      'Manipulação de arquivos',
      'Instalação de dependências',
      'Configuração de ambientes',
      'Automação de tarefas'
    ],
    gradient: 'from-purple-600/20 to-blue-600/20'
  },
  {
    icon: Link2,
    title: 'Integração com APIs',
    brief: 'Conecta com serviços externos',
    details: [
      'APIs REST e GraphQL',
      'Webhooks e eventos',
      'OAuth e autenticação',
      'Processamento de dados',
      'Sincronização em tempo real'
    ],
    gradient: 'from-blue-600/20 to-purple-600/20'
  }
];


// Real use cases based on what Prophet can actually do
const useCases = [
  {
    icon: Search,
    title: 'Análise de Concorrentes',
    description: 'Pesquisa mercado, identifica players principais, analisa forças e fraquezas',
    time: '5 min',
    category: 'Pesquisa',
    gradient: 'from-blue-600 to-cyan-600',
    bgColor: 'from-blue-600/20 to-cyan-600/10',
    workflow: [
      { icon: Globe2, label: 'Busca' },
      { icon: Database, label: 'Análise' },
      { icon: FileText, label: 'Insights' },
      { icon: Send, label: 'Envio' }
    ]
  },
  {
    icon: FileText,
    title: 'Geração de Relatórios',
    description: 'Cria relatórios profissionais em PDF ou Excel com dados estruturados',
    time: '3 min',
    category: 'Documentos',
    gradient: 'from-emerald-600 to-teal-600',
    bgColor: 'from-emerald-600/20 to-teal-600/10',
    workflow: [
      { icon: Globe2, label: 'Scrape' },
      { icon: Database, label: 'Merge' },
      { icon: FileDown, label: 'PDF' },
      { icon: MessageSquare, label: 'WhatsApp' }
    ]
  },
  {
    icon: Table,
    title: 'Web Scraping',
    description: 'Extrai dados de sites, forums e redes sociais automaticamente',
    time: '2 min',
    category: 'Automação',
    gradient: 'from-purple-600 to-violet-600',
    bgColor: 'from-purple-600/20 to-violet-600/10',
    workflow: [
      { icon: Globe2, label: 'Navega' },
      { icon: Table, label: 'Extrai' },
      { icon: Database, label: 'Estrutura' },
      { icon: FileDown, label: 'Excel' }
    ]
  },
  {
    icon: MessageSquare,
    title: 'Chatbot Inteligente',
    description: 'Cria assistentes virtuais com IA para atendimento 24/7',
    time: '4 min',
    category: 'IA',
    gradient: 'from-pink-600 to-rose-600',
    bgColor: 'from-pink-600/20 to-rose-600/10',
    workflow: [
      { icon: Users, label: 'Cliente' },
      { icon: Bot, label: 'IA' },
      { icon: Database, label: 'Contexto' },
      { icon: MessageSquare, label: 'Resposta' }
    ]
  },
  {
    icon: Terminal,
    title: 'Automação de Deploy',
    description: 'Deploy automático de aplicações com CI/CD integrado',
    time: '6 min',
    category: 'DevOps',
    gradient: 'from-orange-600 to-amber-600',
    bgColor: 'from-orange-600/20 to-amber-600/10',
    workflow: [
      { icon: GitBranch, label: 'Git' },
      { icon: Code, label: 'Build' },
      { icon: Terminal, label: 'Testes' },
      { icon: Cloud, label: 'Deploy' }
    ]
  },
  {
    icon: Globe,
    title: 'Monitoramento Web',
    description: 'Monitora sites e APIs, alertando sobre mudanças ou problemas',
    time: '1 min',
    category: 'Monitor',
    gradient: 'from-indigo-600 to-blue-600',
    bgColor: 'from-indigo-600/20 to-blue-600/10',
    workflow: [
      { icon: Globe, label: 'Check' },
      { icon: Activity, label: 'Status' },
      { icon: Bell, label: 'Alerta' },
      { icon: Send, label: 'Notifica' }
    ]
  },
  {
    icon: FileCode,
    title: 'Geração de Código',
    description: 'Desenvolve aplicações completas em React, Python, Node.js',
    time: '8 min',
    category: 'Código',
    gradient: 'from-green-600 to-emerald-600',
    bgColor: 'from-green-600/20 to-emerald-600/10',
    workflow: [
      { icon: MessageSquare, label: 'Brief' },
      { icon: Code, label: 'Código' },
      { icon: Terminal, label: 'Testa' },
      { icon: GitBranch, label: 'Commit' }
    ]
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analytics',
    description: 'Cria dashboards interativos com visualização de dados em tempo real',
    time: '7 min',
    category: 'Analytics',
    gradient: 'from-red-600 to-orange-600',
    bgColor: 'from-red-600/20 to-orange-600/10',
    workflow: [
      { icon: Database, label: 'Dados' },
      { icon: TrendingUp, label: 'Análise' },
      { icon: BarChart3, label: 'Charts' },
      { icon: Globe, label: 'Publica' }
    ]
  }
];

export function FeaturesSection() {
  const [expandedFeatures, setExpandedFeatures] = useState<number[]>([]);
  const [selectedUseCase, setSelectedUseCase] = useState<number>(1); // Start with "Geração de Relatórios" (index 1)

  const toggleFeature = (index: number) => {
    setExpandedFeatures(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section id="features" className="relative w-full py-24 px-6 overflow-hidden">
      {/* Section background with subtle gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">Capacidades Reais</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-4">
            Um assistente que <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">realmente executa</span>
          </h2>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Prophet não apenas sugere código. Ele pesquisa, analisa, desenvolve e automatiza tarefas complexas de ponta a ponta.
          </p>
        </div>

        {/* Expandable Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {featureCategories.map((feature, index) => {
            const isExpanded = expandedFeatures.includes(index);
            
            return (
              <div
                key={index}
                className="group relative"
              >
                {/* Card */}
                <div 
                  className={`relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer
                    ${isExpanded 
                      ? 'border-purple-600/30 bg-purple-600/5' 
                      : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-purple-600/20'
                    }`}
                  onClick={() => toggleFeature(index)}
                >
                  {/* Gradient background */}
                  <div 
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} transition-opacity duration-300
                      ${isExpanded ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'}`}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={`p-2.5 rounded-xl border transition-colors
                          ${isExpanded 
                            ? 'bg-purple-600/15 border-purple-600/30' 
                            : 'bg-purple-600/10 border-purple-600/20'
                          }`}>
                          <feature.icon className="h-4 w-4 text-purple-400" />
                        </div>
                        
                        {/* Title */}
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {feature.brief}
                          </p>
                        </div>
                      </div>
                      
                      {/* Chevron */}
                      <div className={`mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    
                    {/* Expandable Details */}
                    <div className={`overflow-hidden transition-all duration-300
                      ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pt-3 border-t border-white/5">
                        <ul className="space-y-2">
                          {feature.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-300 leading-relaxed">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Use Cases Showcase - Bento Grid with Colored Borders */}
        <div className="relative mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-white mb-2">
              Casos de uso reais
            </h3>
            <p className="text-gray-400">
              Veja o que Prophet pode fazer por você hoje
            </p>
          </div>

          {/* Bento Grid Layout with auto-fit */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto auto-rows-fr">
            {useCases.map((useCase, index) => {
              const isActive = selectedUseCase === index;
              
              // Extract colors for borders
              const colors = {
                'blue-600': '#2563eb',
                'cyan-600': '#0891b2',
                'emerald-600': '#059669',
                'teal-600': '#0d9488',
                'purple-600': '#9333ea',
                'violet-600': '#7c3aed',
                'pink-600': '#db2777',
                'rose-600': '#e11d48',
                'orange-600': '#ea580c',
                'amber-600': '#d97706',
                'indigo-600': '#4f46e5',
                'green-600': '#16a34a',
                'red-600': '#dc2626'
              };
              
              const gradientStart = useCase.gradient.split(' ')[0].replace('from-', '');
              const gradientEnd = useCase.gradient.split(' ')[1].replace('to-', '');
              const primaryColor = colors[gradientStart] || '#9333ea';
              const secondaryColor = colors[gradientEnd] || primaryColor;
              
              return (
                <motion.div
                  key={index}
                  layout
                  layoutId={`usecase-${index}`}
                  className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm cursor-pointer
                    ${isActive 
                      ? 'z-20 shadow-2xl shadow-black/50 lg:col-span-2 lg:row-span-2' 
                      : 'border-white/5 hover:border-white/10 z-0'
                    }`}
                  onClick={() => setSelectedUseCase(index)}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  whileHover={!isActive ? {
                    scale: 1.02,
                  } : {}}
                  transition={{
                    layout: { type: "spring", stiffness: 350, damping: 25 },
                    scale: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  style={{
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                  }}
                >
                  {/* Top border gradient on hover/active */}
                  <div 
                    className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300
                      ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                    style={{
                      background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative p-5">
                    {/* Header with icon and time */}
                    <div className="flex items-start justify-between mb-4">
                      {/* Icon with gradient border when active */}
                      <div 
                        className={`p-2.5 rounded-lg border transition-all duration-300
                          ${!isActive && 'border-white/10 group-hover:border-white/20'}`}
                        style={isActive ? {
                          borderColor: primaryColor,
                          boxShadow: `0 0 20px ${primaryColor}20`
                        } : {}}
                      >
                        <useCase.icon 
                          className={`h-4 w-4 transition-colors duration-300
                            ${!isActive && 'text-gray-400 group-hover:text-gray-300'}`}
                          style={isActive ? { color: primaryColor } : {}}
                        />
                      </div>
                      
                      {/* Time with colored dot */}
                      <div className="flex items-center gap-1.5">
                        <div 
                          className={`h-1.5 w-1.5 rounded-full transition-all duration-300
                            ${isActive ? 'animate-pulse' : 'bg-gray-600'}`}
                          style={isActive ? { backgroundColor: primaryColor } : {}}
                        />
                        <span 
                          className={`text-xs font-mono transition-colors duration-300
                            ${isActive ? '' : 'text-gray-500 group-hover:text-gray-400'}`}
                          style={isActive ? { color: primaryColor } : {}}
                        >
                          {useCase.time}
                        </span>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h4 className={`text-sm font-semibold mb-2 transition-colors duration-300
                      ${isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                      {useCase.title}
                    </h4>
                    
                    {/* Description */}
                    <p className={`text-xs leading-relaxed mb-3 transition-colors duration-300
                      ${isActive ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}`}>
                      {useCase.description}
                    </p>
                    
                    {/* Category badge with colored text when active */}
                    <div className="flex items-center justify-between">
                      <span 
                        className={`text-[10px] px-2 py-1 rounded-full border transition-all duration-300
                          ${!isActive && 'border-white/10 text-gray-500 group-hover:border-white/20 group-hover:text-gray-400'}`}
                        style={isActive ? {
                          borderColor: `${primaryColor}40`,
                          color: primaryColor,
                          backgroundColor: `${primaryColor}08`
                        } : {}}
                      >
                        {useCase.category}
                      </span>
                      
                      {/* Active indicator arrow */}
                      {isActive && (
                        <ChevronDown 
                          className="h-3 w-3 rotate-[-90deg] opacity-60"
                          style={{ color: primaryColor }}
                        />
                      )}
                    </div>
                    
                    {/* Workflow visualization when active */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center"
                      >
                        {/* Workflow title */}
                        <span 
                          className="text-xs font-medium mb-6 opacity-70"
                          style={{ color: primaryColor }}
                        >
                          Exemplo de fluxo
                        </span>
                        
                        {/* Workflow steps */}
                        <div className="flex items-center justify-center gap-3 pb-4">
                          {useCase.workflow.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-center">
                              {/* Step */}
                              <div className="flex flex-col items-center">
                                <div 
                                  className="p-2.5 rounded-xl border transition-all duration-300"
                                  style={{
                                    borderColor: `${primaryColor}30`,
                                    backgroundColor: `${primaryColor}10`
                                  }}
                                >
                                  <step.icon 
                                    className="h-5 w-5"
                                    style={{ color: primaryColor }}
                                  />
                                </div>
                                <span 
                                  className="text-[11px] mt-2 text-center font-medium"
                                  style={{ color: `${primaryColor}dd` }}
                                >
                                  {step.label}
                                </span>
                              </div>
                              
                              {/* Arrow between steps */}
                              {stepIndex < useCase.workflow.length - 1 && (
                                <ArrowRight 
                                  className="h-4 w-4 mx-2 mb-6 opacity-50"
                                  style={{ color: primaryColor }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Bottom gradient line when active */}
                  <div 
                    className={`absolute bottom-0 left-0 right-0 h-[1px] transition-opacity duration-300
                      ${isActive ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                      background: `linear-gradient(90deg, transparent, ${primaryColor}, ${secondaryColor}, transparent)`
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Pro Tip */}
        <div className="mt-16 flex justify-center">
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600/10 to-violet-600/10 border border-purple-600/20">
            <Lightbulb className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-gray-300">
              <span className="text-purple-400 font-medium">Dica:</span> Prophet mantém contexto completo entre tarefas, permitindo workflows complexos
            </span>
          </div>
        </div>
      </div>

      {/* Subtle animated background elements */}
      <div className="absolute top-1/3 -left-20 w-40 h-40 bg-purple-600/5 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/3 -right-20 w-40 h-40 bg-violet-600/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
    </section>
  );
}