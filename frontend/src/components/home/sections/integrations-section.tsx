'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  category: string;
  examples: {
    title: string;
    description: string;
    persona: string;
  }[];
}


const integrations: Integration[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: (
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
        alt="WhatsApp" 
        width={32} 
        height={32}
        className="w-8 h-8 object-contain"
      />
    ),
    color: 'bg-green-500',
    category: 'Mensagens',
    examples: [
      {
        title: 'Notificações de Vendas',
        description: 'Receba alertas no WhatsApp quando realizar vendas ou atingir metas',
        persona: 'E-commerce'
      },
      {
        title: 'Relatórios Diários',
        description: 'Receba resumos e métricas importantes toda manhã no seu WhatsApp',
        persona: 'Gestores'
      },
      {
        title: 'Alertas Personalizados',
        description: 'Configure notificações para eventos importantes do seu negócio',
        persona: 'Profissionais'
      }
    ]
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: (
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" 
        alt="Gmail" 
        width={32} 
        height={32}
        className="w-8 h-8 object-contain"
      />
    ),
    color: 'bg-gray-100 dark:bg-gray-800',
    category: 'Email',
    examples: [
      {
        title: 'Organização de Emails',
        description: 'Crie tarefas automáticas a partir de emails importantes',
        persona: 'Vendas'
      },
      {
        title: 'Alertas de Email',
        description: 'Seja notificado no WhatsApp sobre emails urgentes ou de clientes VIP',
        persona: 'Marketing'
      },
      {
        title: 'Resumos Inteligentes',
        description: 'Gere resumos de conversas longas e extraia ações necessárias',
        persona: 'C-Level'
      }
    ]
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    icon: (
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" 
        alt="Google Sheets" 
        width={32} 
        height={32}
        className="w-8 h-8 object-contain"
      />
    ),
    color: 'bg-gray-100 dark:bg-gray-800',
    category: 'Planilhas',
    examples: [
      {
        title: 'Análise de Dados',
        description: 'Gere insights e gráficos automaticamente dos seus dados',
        persona: 'Analistas'
      },
      {
        title: 'Controle de Estoque',
        description: 'Atualize estoque via WhatsApp e receba alertas de reposição',
        persona: 'Varejo'
      },
      {
        title: 'Relatórios Financeiros',
        description: 'Consolide dados de múltiplas fontes em relatórios automáticos',
        persona: 'Financeiro'
      }
    ]
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: (
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" 
        alt="Notion" 
        width={32} 
        height={32}
        className="w-8 h-8 object-contain"
      />
    ),
    color: 'bg-black dark:bg-white',
    category: 'Produtividade',
    examples: [
      {
        title: 'Base de Conhecimento',
        description: 'Alimente seu Notion com informações de outros apps automaticamente',
        persona: 'Times'
      },
      {
        title: 'Gestão de Projetos',
        description: 'Crie tarefas a partir de emails, mensagens ou comandos de voz',
        persona: 'Gerentes'
      },
      {
        title: 'CRM Personalizado',
        description: 'Atualize dados de clientes automaticamente de várias fontes',
        persona: 'Vendas'
      }
    ]
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: (
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" 
        alt="Instagram" 
        width={32} 
        height={32}
        className="w-8 h-8 object-contain"
      />
    ),
    color: 'bg-gray-100 dark:bg-gray-800',
    category: 'Social Media',
    examples: [
      {
        title: 'Análise de Conteúdo',
        description: 'Extraia insights e tendências dos seus posts e da concorrência',
        persona: 'Marketing'
      },
      {
        title: 'Relatórios de Performance',
        description: 'Compile métricas de engajamento em planilhas automáticas',
        persona: 'Influencers'
      },
      {
        title: 'Gestão de Conteúdo',
        description: 'Organize ideias e crie calendários editoriais baseados em dados',
        persona: 'Marcas'
      }
    ]
  }
];

export function IntegrationsSection() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration>(integrations[0]);

  return (
    <section className="py-32 px-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            2700+ INTEGRAÇÕES
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Conecte. Automatize. Escale.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Integre com mais de 2700 aplicativos e serviços. 
            O Prophet conecta todas suas ferramentas favoritas e cria fluxos de trabalho automatizados.
          </p>
        </div>

        {/* Integration Grid with Visual Design */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
          {integrations.map((integration) => (
            <button
              key={integration.id}
              onClick={() => setSelectedIntegration(integration)}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                selectedIntegration.id === integration.id
                  ? 'border-primary bg-primary/5 shadow-lg scale-105'
                  : 'border-border hover:border-primary/50 hover:shadow-md'
              }`}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className={`w-14 h-14 rounded-xl ${integration.color} flex items-center justify-center mb-3 mx-auto shadow-lg p-3`}>
                  {integration.icon}
                </div>
                <p className="font-semibold text-sm">{integration.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{integration.category}</p>
              </div>
              
              {/* Selection indicator */}
              {selectedIntegration.id === integration.id && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Use Cases with Modern Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {selectedIntegration.examples.map((example, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Card background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              <Card className="relative h-full border-2 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                <CardContent className="p-8">
                  {/* Category badge */}
                  <Badge 
                    variant="secondary" 
                    className="mb-6 bg-primary/10 text-primary border-0"
                  >
                    {example.persona}
                  </Badge>
                  
                  
                  {/* Title */}
                  <h3 className="font-bold text-xl mb-4">
                    {example.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {example.description}
                  </p>
                  
                  {/* Visual accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Integration Showcase - Modern Bento Grid Design */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-center mb-3">Conecte com mais de 2700 aplicativos</h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Integre todas suas ferramentas favoritas e crie automações poderosas em minutos
          </p>
          
          {/* Modern Bento Grid Layout - Mobile Optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-3 md:gap-4 max-w-5xl mx-auto">
            {/* WhatsApp - Large feature */}
            <div className="col-span-2 sm:col-span-4 md:col-span-4 md:row-span-2 group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-4 md:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-green-500/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-12 md:w-16 h-12 md:h-16 mb-3 md:mb-4">
                  <Image 
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                    alt="WhatsApp" 
                    width={64} 
                    height={64}
                    className="object-contain"
                  />
                </div>
                <h4 className="font-semibold text-base md:text-lg mb-1 md:mb-2">WhatsApp</h4>
                <p className="text-xs md:text-sm text-muted-foreground">Notificações instantâneas e comunicação direta com clientes</p>
              </div>
            </div>
            
            {/* Gmail */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" 
                  alt="Gmail" 
                  width={40} 
                  height={40}
                  className="object-contain w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm md:text-base">Gmail</h4>
                  <p className="text-xs text-muted-foreground hidden sm:block">Gestão inteligente de emails</p>
                </div>
              </div>
            </div>
            
            {/* Notion */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-gray-900/10 to-gray-800/5 dark:from-gray-100/10 dark:to-gray-200/5 border border-gray-500/20 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" 
                  alt="Notion" 
                  width={40} 
                  height={40}
                  className="object-contain w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm md:text-base">Notion</h4>
                  <p className="text-xs text-muted-foreground hidden sm:block">Base de conhecimento centralizada</p>
                </div>
              </div>
            </div>
            
            {/* Center Stats - Mobile optimized */}
            <div className="col-span-2 sm:col-span-4 md:col-span-4 md:row-span-2 order-last sm:order-none md:order-none flex items-center justify-center rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4 sm:p-6 md:p-8">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-1 md:mb-2">2700+</div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Integrações disponíveis</p>
                <div className="flex items-center justify-center gap-2 mt-3 md:mt-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-300" />
                </div>
              </div>
            </div>
            
            {/* Slack */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" 
                  alt="Slack" 
                  width={40} 
                  height={40}
                  className="object-contain w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm md:text-base">Slack</h4>
                  <p className="text-xs text-muted-foreground hidden sm:block">Colaboração em equipe</p>
                </div>
              </div>
            </div>
            
            {/* Google Sheets */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-green-600/10 to-green-700/5 border border-green-600/20 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" 
                  alt="Google Sheets" 
                  width={40} 
                  height={40}
                  className="object-contain w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm md:text-base">Google Sheets</h4>
                  <p className="text-xs text-muted-foreground hidden sm:block">Planilhas e dados</p>
                </div>
              </div>
            </div>
            
            {/* Telegram - Hidden on mobile */}
            <div className="hidden md:block md:col-span-4 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-400/10 to-blue-500/5 border border-blue-400/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" 
                  alt="Telegram" 
                  width={48} 
                  height={48}
                  className="object-contain"
                />
                <div>
                  <h4 className="font-semibold">Telegram</h4>
                  <p className="text-xs text-muted-foreground">Mensagens e bots</p>
                </div>
              </div>
            </div>
            
            {/* More Apps Section - Full width */}
            <div className="col-span-2 sm:col-span-4 md:col-span-12 rounded-2xl md:rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border p-4 sm:p-6 md:p-8 mt-3 md:mt-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-4 sm:mb-6 text-center">E muito mais...</p>
              <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 flex-wrap">
                {/* Instagram */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 sm:hover:scale-125 transition-transform cursor-pointer">
                  <Image 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" 
                    alt="Instagram" 
                    width={48} 
                    height={48}
                    className="object-contain w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  />
                </div>
                {/* Trello */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 sm:hover:scale-125 transition-transform cursor-pointer">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="200" rx="25" fill="#0052CC"/>
                    <rect x="40" y="40" width="50" height="120" rx="8" fill="white"/>
                    <rect x="110" y="40" width="50" height="80" rx="8" fill="white"/>
                  </svg>
                </div>
                {/* Discord */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 sm:hover:scale-125 transition-transform cursor-pointer">
                  <Image 
                    src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" 
                    alt="Discord" 
                    width={48} 
                    height={48}
                    className="object-contain w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  />
                </div>
                {/* LinkedIn */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 sm:hover:scale-125 transition-transform cursor-pointer">
                  <Image 
                    src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                    alt="LinkedIn" 
                    width={48} 
                    height={48}
                    className="object-contain w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  />
                </div>
                {/* Spotify */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 sm:hover:scale-125 transition-transform cursor-pointer">
                  <Image 
                    src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
                    alt="Spotify" 
                    width={48} 
                    height={48}
                    className="object-contain w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  />
                </div>
                {/* GitHub */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 sm:hover:scale-125 transition-transform cursor-pointer">
                  <Image 
                    src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" 
                    alt="GitHub" 
                    width={48} 
                    height={48}
                    className="object-contain dark:invert w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-8 mb-20">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">2700+</div>
            <p className="text-muted-foreground">Apps integrados</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <p className="text-muted-foreground">Automação contínua</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">5min</div>
            <p className="text-muted-foreground">Setup instantâneo</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <p className="text-lg text-muted-foreground">
              Todas as suas ferramentas favoritas em um só lugar
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Conecte aplicativos de produtividade, comunicação, vendas, marketing, finanças e muito mais. 
              O Prophet se integra com praticamente qualquer ferramenta que você já usa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}