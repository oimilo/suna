'use client';

import { Zap, MessageSquare, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Conecte seus apps',
    description: 'Escolha entre mais de 100 integrações disponíveis. WhatsApp, Gmail, Notion, Sheets e muito mais.',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-blue-500'
  },
  {
    number: '02',
    title: 'Descreva o que precisa',
    description: 'Use linguagem natural. Diga ao Prophet o que fazer como se estivesse conversando com um assistente.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'text-purple-500'
  },
  {
    number: '03',
    title: 'Deixe a mágica acontecer',
    description: 'O Prophet cria automações inteligentes que rodam 24/7, economizando horas do seu trabalho repetitivo.',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-pink-500'
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simples como conversar
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Não precisa de código, não precisa de tutoriais. Se você sabe descrever, o Prophet sabe fazer.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-[2px] bg-gradient-to-r from-border to-transparent -translate-x-1/2" />
              )}
              
              <div className="text-center">
                {/* Number */}
                <div className="text-6xl font-bold text-muted-foreground/20 mb-4">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background border-2 border-border mb-6 ${step.color}`}>
                  {step.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Examples */}
        <div className="mt-16 bg-background rounded-2xl border p-8">
          <p className="text-sm font-medium text-muted-foreground mb-4">EXEMPLOS REAIS DE COMANDOS</p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <p className="text-lg">"Me avise no WhatsApp quando tiver uma nova venda registrada na planilha"</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <p className="text-lg">"Analise meus emails e crie um resumo das tarefas pendentes no Notion"</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <p className="text-lg">"Gere um relatório semanal das métricas do Instagram e envie por email"</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}