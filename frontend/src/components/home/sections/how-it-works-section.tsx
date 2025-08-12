'use client';

import { useState } from 'react';
import { Zap, MessageSquare, Sparkles, Check, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    number: '01',
    title: 'Conecte seus apps',
    description: 'Escolha entre mais de 100 integrações disponíveis. WhatsApp, Gmail, Notion, Sheets e muito mais.',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    features: ['Setup em minutos', 'Sem código necessário', 'Conexões seguras'],
    highlight: 'Integração instantânea'
  },
  {
    number: '02',
    title: 'Descreva o que precisa',
    description: 'Use linguagem natural. Diga ao Prophet o que fazer como se estivesse conversando com um assistente.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-500/10 to-purple-600/5',
    features: ['Linguagem natural', 'IA avançada', 'Entende contexto'],
    highlight: 'Simples como conversar'
  },
  {
    number: '03',
    title: 'Automação inteligente',
    description: 'O Prophet cria fluxos de trabalho que rodam 24/7, executando tarefas complexas automaticamente.',
    icon: <Cpu className="w-6 h-6" />,
    color: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-500/10 to-emerald-600/5',
    features: ['Execução 24/7', 'Monitoramento contínuo', 'Otimização automática'],
    highlight: 'Trabalha enquanto você dorme'
  }
];

const exampleCommands = [
  {
    command: 'Me avise no WhatsApp quando tiver uma nova venda registrada na planilha',
    category: 'Vendas',
    highlight: 'WhatsApp',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-400/20 to-emerald-400/20'
  },
  {
    command: 'Analise meus emails e crie um resumo das tarefas pendentes no Notion',
    category: 'Produtividade',
    highlight: 'Notion',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-400/20 to-indigo-400/20'
  },
  {
    command: 'Gere um relatório semanal das métricas do Instagram e envie por email',
    category: 'Analytics',
    highlight: 'Instagram',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-400/20 to-pink-400/20'
  }
];

export function HowItWorksSection() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Header with badge */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            SETUP EM 3 PASSOS
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Simples como conversar
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Não precisa de código, não precisa de tutoriais. 
            Se você sabe descrever, o Prophet sabe fazer.
          </p>
        </div>

        {/* Steps with enhanced visual design */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
              onMouseEnter={() => setHoveredStep(index)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {/* Connection line with gradient */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-24 left-full w-full">
                  <div className="h-[2px] bg-gradient-to-r from-border via-primary/20 to-transparent -translate-x-1/2" />
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary transition-all duration-300 ${
                    hoveredStep === index ? 'scale-150 opacity-100' : 'scale-0 opacity-0'
                  }`} />
                </div>
              )}
              
              <Card className="h-full border-2 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <CardContent className="relative p-8">
                  {/* Step number with modern style */}
                  <div className="absolute top-4 right-4">
                    <div className="text-5xl font-bold text-muted-foreground/10">
                      {step.number}
                    </div>
                  </div>
                  
                  {/* Icon with gradient background */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg transform transition-transform duration-300 group-hover:scale-110`}>
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Highlight badge */}
                  <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-0">
                    {step.highlight}
                  </Badge>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 transition-transform duration-300 group-hover:translate-x-1">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Features list */}
                  <div className="space-y-2">
                    {step.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color}`} />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Visual accent */}
                  <div className="absolute bottom-0 right-0 w-24 h-24">
                    <div className={`w-full h-full bg-gradient-to-br ${step.color} opacity-5 rounded-tl-full`} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Examples section - Modern mobile-first design */}
        <div className="relative mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Comandos que o Prophet entende</h3>
            <p className="text-muted-foreground text-sm md:text-base">Converse naturalmente e deixe a mágica acontecer</p>
          </div>
          
          {/* Chat-like command list */}
          <div className="max-w-4xl mx-auto space-y-4 px-4 md:px-6">
            {exampleCommands.map((example, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Mobile-first chat bubble design */}
                <div className={`relative ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'} w-full md:w-[70%] lg:w-[60%]`}>
                  {/* Message bubble */}
                  <div className={`relative rounded-2xl p-5 md:p-6 border ${example.borderColor} ${example.bgColor} 
                    ${index % 2 === 0 ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
                  >
                    {/* Category tag */}
                    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${example.textColor} mb-3`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {example.category}
                    </div>
                    
                    {/* Command text with highlighted word */}
                    <p className="text-sm md:text-base leading-relaxed text-foreground/90">
                      {example.command.split(example.highlight).map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className={`font-semibold ${example.textColor}`}>
                              {example.highlight}
                            </span>
                          )}
                        </span>
                      ))}
                    </p>
                    
                  </div>
                  
                  {/* Message tail */}
                  <div className={`absolute top-5 ${index % 2 === 0 ? '-left-2' : '-right-2'} 
                    w-4 h-4 ${example.bgColor} border ${example.borderColor} 
                    transform rotate-45 ${index % 2 === 0 ? 'border-r-0 border-t-0' : 'border-l-0 border-b-0'}`} 
                  />
                  
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}