'use client';

import { useState } from 'react';
import { Zap, MessageSquare, Sparkles, Check, Cpu, ArrowDown } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Conecte seus apps',
    description: 'Escolha entre mais de 2700 integrações disponíveis. WhatsApp, Gmail, Notion, Sheets e muito mais.',
    icon: Zap,
    features: ['Setup em minutos', 'Sem código necessário', 'Conexões seguras'],
    highlight: 'Integração instantânea'
  },
  {
    number: '02',
    title: 'Descreva o que precisa',
    description: 'Use linguagem natural. Diga ao Prophet o que fazer como se estivesse conversando com um assistente.',
    icon: MessageSquare,
    features: ['Linguagem natural', 'IA avançada', 'Entende contexto'],
    highlight: 'Simples como conversar'
  },
  {
    number: '03',
    title: 'Automação inteligente',
    description: 'O Prophet cria fluxos de trabalho que rodam 24/7, executando tarefas complexas automaticamente.',
    icon: Cpu,
    features: ['Execução 24/7', 'Monitoramento contínuo', 'Otimização automática'],
    highlight: 'Trabalha enquanto você dorme'
  }
];

const exampleCommands = [
  {
    command: 'Me avise no WhatsApp quando tiver uma nova venda registrada na planilha',
    category: 'Vendas',
    highlight: 'WhatsApp',
  },
  {
    command: 'Analise meus emails e crie um resumo das tarefas pendentes no Notion',
    category: 'Produtividade',
    highlight: 'Notion',
  },
  {
    command: 'Gere um relatório semanal das métricas do Instagram e envie por email',
    category: 'Analytics',
    highlight: 'Instagram',
  }
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hoveredCommand, setHoveredCommand] = useState<number | null>(null);

  return (
    <section className="relative w-full py-24 px-6 overflow-hidden">
      {/* Section background with subtle gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">Setup em 3 Passos</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-4">
            Simples como <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">conversar</span>
          </h2>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Não precisa de código, não precisa de tutoriais. Se você sabe descrever, o Prophet sabe fazer.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative max-w-4xl mx-auto mb-24">
          {/* Central vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-full bg-gradient-to-b from-purple-600/20 via-purple-600/40 to-purple-600/20" />
          
          {/* Steps */}
          <div className="space-y-20">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              const isLeft = index % 2 === 0;
              
              return (
                <div 
                  key={index}
                  className={`relative flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                  onMouseEnter={() => setActiveStep(index)}
                >
                  {/* Content */}
                  <div className={`w-1/2 ${isLeft ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                    {/* Number */}
                    <div className={`text-6xl font-bold text-white/5 mb-2 ${isLeft ? 'text-right' : 'text-left'}`}>
                      {step.number}
                    </div>
                    
                    {/* Title */}
                    <h3 className={`text-2xl font-semibold text-white mb-3 transition-all duration-300 ${
                      isActive ? 'transform scale-105' : ''
                    }`}>
                      {step.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-400 mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* Highlight */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 mb-4`}>
                      <span className="text-xs font-medium text-purple-400">{step.highlight}</span>
                    </div>
                    
                    {/* Features */}
                    <div className={`space-y-2 ${isLeft ? 'items-end' : 'items-start'} flex flex-col`}>
                      {step.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          {!isLeft && <Check className="h-3 w-3 text-purple-400" />}
                          <span className="text-xs text-gray-500">{feature}</span>
                          {isLeft && <Check className="h-3 w-3 text-purple-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Center Circle with Icon */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                      isActive 
                        ? 'bg-purple-600/20 border-purple-600/40 scale-110' 
                        : 'bg-white/[0.01] border-white/10 hover:bg-purple-600/10 hover:border-purple-600/30'
                    }`}>
                      <Icon className={`h-6 w-6 transition-colors duration-300 ${
                        isActive ? 'text-purple-400' : 'text-gray-400'
                      }`} />
                      
                      {/* Pulse animation when active */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-purple-600/20 animate-ping" />
                      )}
                    </div>
                    
                    {/* Connector arrow */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4">
                        <ArrowDown className="h-4 w-4 text-purple-600/40 animate-bounce" style={{ animationDelay: `${index * 0.5}s` }} />
                      </div>
                    )}
                  </div>
                  
                  {/* Empty space for opposite side */}
                  <div className="w-1/2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Examples Section - Terminal Style */}
        <div className="relative">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-white mb-2">
              Comandos que o Prophet entende
            </h3>
            <p className="text-gray-400">
              Converse naturalmente e deixe a mágica acontecer
            </p>
          </div>
          
          {/* Terminal-like container */}
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-black/40 backdrop-blur-sm border border-white/5 overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-500 ml-2">Prophet Terminal</span>
              </div>
              
              {/* Commands */}
              <div className="p-6 space-y-4">
                {exampleCommands.map((example, index) => (
                  <div
                    key={index}
                    className="group relative"
                    onMouseEnter={() => setHoveredCommand(index)}
                    onMouseLeave={() => setHoveredCommand(null)}
                  >
                    {/* Command prompt */}
                    <div className="flex items-start gap-3">
                      <span className="text-purple-400 font-mono text-sm">$</span>
                      <div className="flex-1">
                        {/* Category */}
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-600/10 border border-purple-600/20 mb-2">
                          <span className="text-xs text-purple-400">{example.category}</span>
                        </div>
                        
                        {/* Command text */}
                        <p className={`text-sm text-gray-300 font-mono transition-all duration-300 ${
                          hoveredCommand === index ? 'text-white translate-x-1' : ''
                        }`}>
                          {example.command.split(example.highlight).map((part, i, arr) => (
                            <span key={i}>
                              {part}
                              {i < arr.length - 1 && (
                                <span className="text-purple-400 font-semibold">
                                  {example.highlight}
                                </span>
                              )}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                    
                    {/* Typing cursor animation */}
                    {hoveredCommand === index && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-4 bg-purple-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Blinking cursor at the end */}
                <div className="flex items-center gap-3 opacity-50">
                  <span className="text-purple-400 font-mono text-sm">$</span>
                  <div className="w-2 h-4 bg-purple-400/60" style={{ animation: 'blink 1s infinite' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle animated background elements */}
      <div className="absolute top-1/2 -left-20 w-40 h-40 bg-purple-600/5 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/3 -right-20 w-40 h-40 bg-violet-600/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Add blink animation */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}