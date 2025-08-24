'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Zap, Check } from 'lucide-react';

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
    color: 'from-green-600/20 to-green-500/10',
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
    color: 'from-red-600/20 to-red-500/10',
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
    color: 'from-emerald-600/20 to-emerald-500/10',
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
    color: 'from-gray-600/20 to-gray-500/10',
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
    color: 'from-pink-600/20 to-purple-500/10',
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
    <section className="relative w-full py-24 px-6 overflow-hidden">
      {/* Section background with subtle gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 mb-6">
            <Zap className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">2700+ Integrações</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-4">
            Conecte. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">Automatize.</span> Escale.
          </h2>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Prophet conecta todas suas ferramentas favoritas e cria fluxos automatizados poderosos.
          </p>
        </div>

        {/* Integration Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
          {integrations.map((integration) => (
            <button
              key={integration.id}
              onClick={() => setSelectedIntegration(integration)}
              className={`group relative p-4 rounded-xl border transition-all duration-300 ${
                selectedIntegration.id === integration.id
                  ? 'border-purple-600/40 bg-purple-600/5'
                  : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-purple-600/20'
              }`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${integration.color} transition-opacity duration-300
                ${selectedIntegration.id === integration.id ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'}`} 
              />
              
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-2 mx-auto p-2">
                  {integration.icon}
                </div>
                <p className="font-medium text-sm text-white">{integration.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{integration.category}</p>
              </div>
              
              {/* Selection indicator */}
              {selectedIntegration.id === integration.id && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Use Cases Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {selectedIntegration.examples.map((example, index) => (
            <div
              key={index}
              className="relative p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-purple-600/20 transition-all duration-300"
            >
              {/* Category badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/10 border border-purple-600/20 mb-4">
                <span className="text-xs font-medium text-purple-400">{example.persona}</span>
              </div>
              
              {/* Title */}
              <h3 className="font-semibold text-base text-white mb-2">
                {example.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-400 leading-relaxed">
                {example.description}
              </p>
              
              {/* Check mark decoration */}
              <div className="absolute top-5 right-5 opacity-10">
                <Check className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Integration Showcase - Modern Bento Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-white text-center mb-3">
            Ecossistema completo de automação
          </h3>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Integre todas suas ferramentas favoritas e crie fluxos poderosos em minutos
          </p>
          
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-3 max-w-6xl mx-auto">
            {/* WhatsApp - Large feature */}
            <div className="col-span-2 sm:col-span-4 md:col-span-4 md:row-span-2 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600/5 to-green-500/5 border border-green-600/20 p-6 hover:border-green-600/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-14 h-14 mb-4">
                  <Image 
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                    alt="WhatsApp" 
                    width={56} 
                    height={56}
                    className="object-contain"
                  />
                </div>
                <h4 className="font-semibold text-lg text-white mb-2">WhatsApp</h4>
                <p className="text-sm text-gray-400">Notificações instantâneas e comunicação direta</p>
              </div>
            </div>
            
            {/* Gmail */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/5 to-red-500/5 border border-red-600/20 p-4 hover:border-red-600/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" 
                  alt="Gmail" 
                  width={40} 
                  height={40}
                  className="object-contain w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white">Gmail</h4>
                  <p className="text-xs text-gray-400 hidden sm:block">Gestão inteligente</p>
                </div>
              </div>
            </div>
            
            {/* Notion */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-600/5 to-gray-500/5 border border-gray-600/20 p-4 hover:border-gray-600/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" 
                  alt="Notion" 
                  width={40} 
                  height={40}
                  className="object-contain w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white">Notion</h4>
                  <p className="text-xs text-gray-400 hidden sm:block">Base de conhecimento</p>
                </div>
              </div>
            </div>
            
            {/* Center Stats */}
            <div className="col-span-2 sm:col-span-4 md:col-span-4 md:row-span-2 order-last sm:order-none flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/10 to-violet-600/10 border border-purple-600/20 p-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 mb-2">
                  2700+
                </div>
                <p className="text-sm font-medium text-gray-300">Integrações disponíveis</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
            
            {/* Slack */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/5 to-purple-500/5 border border-purple-600/20 p-4 hover:border-purple-600/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" 
                  alt="Slack" 
                  width={40} 
                  height={40}
                  className="object-contain w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white">Slack</h4>
                  <p className="text-xs text-gray-400 hidden sm:block">Colaboração</p>
                </div>
              </div>
            </div>
            
            {/* Google Sheets */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/5 to-emerald-500/5 border border-emerald-600/20 p-4 hover:border-emerald-600/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" 
                  alt="Google Sheets" 
                  width={40} 
                  height={40}
                  className="object-contain w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white">Sheets</h4>
                  <p className="text-xs text-gray-400 hidden sm:block">Planilhas</p>
                </div>
              </div>
            </div>
            
            {/* Telegram */}
            <div className="hidden md:block md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/5 to-blue-500/5 border border-blue-600/20 p-4 hover:border-blue-600/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" 
                  alt="Telegram" 
                  width={40} 
                  height={40}
                  className="object-contain w-10 h-10"
                />
                <div>
                  <h4 className="font-semibold text-white">Telegram</h4>
                  <p className="text-xs text-gray-400">Mensagens e bots</p>
                </div>
              </div>
            </div>
            
            {/* More Apps Section - Animated Slider */}
            <div className="col-span-2 sm:col-span-4 md:col-span-12 rounded-2xl bg-white/[0.01] border border-white/5 p-6 mt-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-400 mb-6 text-center">E muito mais...</p>
              
              {/* Slider Container - 50% width and centered */}
              <div className="relative max-w-[50%] mx-auto overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,white_20%,white_80%,transparent_100%)]">
                {/* Scrolling container */}
                <div className="flex gap-6">
                  {/* First set of logos */}
                  <div className="flex gap-8 animate-scroll-left">
                    {/* Instagram */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" 
                        alt="Instagram" 
                        width={48} 
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    {/* Trello */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <rect width="200" height="200" rx="25" fill="#0052CC"/>
                        <rect x="40" y="40" width="50" height="120" rx="8" fill="white"/>
                        <rect x="110" y="40" width="50" height="80" rx="8" fill="white"/>
                      </svg>
                    </div>
                    {/* Discord */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <Image 
                        src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" 
                        alt="Discord" 
                        width={48} 
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    {/* LinkedIn */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                        alt="LinkedIn" 
                        width={48} 
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    {/* Spotify */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
                        alt="Spotify" 
                        width={48} 
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    {/* GitHub */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="white" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    {/* Dropbox */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#0061FF" d="M63.5 0L0 40.5l63.5 40.5L127 40.5z"/>
                        <path fill="#0061FF" d="M192.5 0L129 40.5l63.5 40.5L256 40.5z"/>
                        <path fill="#0061FF" d="M63.5 101L0 141.5L63.5 182L127 141.5z"/>
                        <path fill="#0061FF" d="M192.5 101L129 141.5l63.5 40.5L256 141.5z"/>
                        <path fill="#0061FF" d="M63.5 202l63.5-40.5L192.5 202L128 242.5z"/>
                      </svg>
                    </div>
                    {/* X (Twitter) */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="white" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    {/* Figma */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#F24E1E" d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
                        <path fill="#FF7262" d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>
                        <path fill="#1ABCFE" d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/>
                        <path fill="#0ACF83" d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/>
                        <path fill="#A259FF" d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
                      </svg>
                    </div>
                    {/* Asana */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FC636B" d="M18.72 10.04a3.28 3.28 0 100-6.56 3.28 3.28 0 000 6.56zM5.28 10.04a3.28 3.28 0 100-6.56 3.28 3.28 0 000 6.56zM12 20.52a3.28 3.28 0 100-6.56 3.28 3.28 0 000 6.56z"/>
                      </svg>
                    </div>
                    {/* Canva */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#00C4CC" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12c2.54 0 4.894-.79 6.834-2.135l-3.107-3.109a7.715 7.715 0 1 1 0-13.512l3.107-3.109A11.943 11.943 0 0 0 12 0zm8.845 5.16l-3.107 3.11a7.686 7.686 0 0 1 0 7.46l3.107 3.11a11.943 11.943 0 0 0 0-13.68z"/>
                      </svg>
                    </div>
                    {/* Supabase */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#3ECF8E" d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.015.985 1.26 1.408 1.874.636l9.26-11.652c1.095-1.378.113-3.406-1.643-3.406h-9.58z"/>
                      </svg>
                    </div>
                    {/* PayPal */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#00457C" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.865c.024-.142.135-.25.279-.25h7.234c1.8 0 3.183.37 4.096 1.178.93.827 1.357 1.917 1.357 3.48 0 .893-.186 1.763-.471 2.4-.293.648-.741 1.234-1.203 1.635-.464.403-1.004.747-1.59.931-.58.183-1.16.223-1.658.223H10.7l-.163.871-.94 5.188-.03.136a.241.241 0 0 0 .236.282h1.825c.127 0 .236-.09.258-.215l1.023-6.373h2.84c3.293 0 5.072-1.6 5.577-4.78.532-3.35-1.488-4.866-4.683-4.866H6.375L4.062 20.52c-.024.137.066.254.206.254h2.808v.563z"/>
                        <path fill="#0079BE" d="M17.247 8.305c-.434 2.682-2.368 4.281-5.19 4.281h-1.314l.92-5.778.03-.135c.021-.125.13-.224.257-.224h.588c1.581 0 3.073 0 3.843.452.459.269.77.696.866 1.404z"/>
                      </svg>
                    </div>
                    {/* Stripe */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Duplicate set for seamless loop */}
                  <div className="flex gap-8 animate-scroll-left">
                    {/* Instagram */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" 
                        alt="Instagram" 
                        width={48} 
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    {/* Trello */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <rect width="200" height="200" rx="25" fill="#0052CC"/>
                        <rect x="40" y="40" width="50" height="120" rx="8" fill="white"/>
                        <rect x="110" y="40" width="50" height="80" rx="8" fill="white"/>
                      </svg>
                    </div>
                    {/* Discord */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <Image 
                        src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" 
                        alt="Discord" 
                        width={48} 
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    {/* LinkedIn */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                        alt="LinkedIn" 
                        width={48} 
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    {/* Spotify */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
                        alt="Spotify" 
                        width={48} 
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    {/* GitHub */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="white" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    {/* Dropbox */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#0061FF" d="M63.5 0L0 40.5l63.5 40.5L127 40.5z"/>
                        <path fill="#0061FF" d="M192.5 0L129 40.5l63.5 40.5L256 40.5z"/>
                        <path fill="#0061FF" d="M63.5 101L0 141.5L63.5 182L127 141.5z"/>
                        <path fill="#0061FF" d="M192.5 101L129 141.5l63.5 40.5L256 141.5z"/>
                        <path fill="#0061FF" d="M63.5 202l63.5-40.5L192.5 202L128 242.5z"/>
                      </svg>
                    </div>
                    {/* X (Twitter) */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="white" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    {/* Figma */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#F24E1E" d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
                        <path fill="#FF7262" d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>
                        <path fill="#1ABCFE" d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/>
                        <path fill="#0ACF83" d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/>
                        <path fill="#A259FF" d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
                      </svg>
                    </div>
                    {/* Asana */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FC636B" d="M18.72 10.04a3.28 3.28 0 100-6.56 3.28 3.28 0 000 6.56zM5.28 10.04a3.28 3.28 0 100-6.56 3.28 3.28 0 000 6.56zM12 20.52a3.28 3.28 0 100-6.56 3.28 3.28 0 000 6.56z"/>
                      </svg>
                    </div>
                    {/* Canva */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#00C4CC" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12c2.54 0 4.894-.79 6.834-2.135l-3.107-3.109a7.715 7.715 0 1 1 0-13.512l3.107-3.109A11.943 11.943 0 0 0 12 0zm8.845 5.16l-3.107 3.11a7.686 7.686 0 0 1 0 7.46l3.107 3.11a11.943 11.943 0 0 0 0-13.68z"/>
                      </svg>
                    </div>
                    {/* Supabase */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#3ECF8E" d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.015.985 1.26 1.408 1.874.636l9.26-11.652c1.095-1.378.113-3.406-1.643-3.406h-9.58z"/>
                      </svg>
                    </div>
                    {/* PayPal */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#00457C" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.865c.024-.142.135-.25.279-.25h7.234c1.8 0 3.183.37 4.096 1.178.93.827 1.357 1.917 1.357 3.48 0 .893-.186 1.763-.471 2.4-.293.648-.741 1.234-1.203 1.635-.464.403-1.004.747-1.59.931-.58.183-1.16.223-1.658.223H10.7l-.163.871-.94 5.188-.03.136a.241.241 0 0 0 .236.282h1.825c.127 0 .236-.09.258-.215l1.023-6.373h2.84c3.293 0 5.072-1.6 5.577-4.78.532-3.35-1.488-4.866-4.683-4.866H6.375L4.062 20.52c-.024.137.066.254.206.254h2.808v.563z"/>
                        <path fill="#0079BE" d="M17.247 8.305c-.434 2.682-2.368 4.281-5.19 4.281h-1.314l.92-5.778.03-.135c.021-.125.13-.224.257-.224h.588c1.581 0 3.073 0 3.843.452.459.269.77.696.866 1.404z"/>
                      </svg>
                    </div>
                    {/* Stripe */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <svg className="w-11 h-11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <style jsx>{`
                @keyframes scroll-left {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-100%);
                  }
                }
                
                .animate-scroll-left {
                  animation: scroll-left 30s linear infinite;
                }
              `}</style>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 mb-2">
              24/7
            </div>
            <p className="text-sm text-gray-400">Automação contínua</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 mb-2">
              5min
            </div>
            <p className="text-sm text-gray-400">Setup instantâneo</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 mb-2">
              100%
            </div>
            <p className="text-sm text-gray-400">Sem código</p>
          </div>
        </div>
      </div>

      {/* Subtle animated background elements */}
      <div className="absolute top-1/4 -right-32 w-64 h-64 bg-violet-600/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -left-32 w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
    </section>
  );
}