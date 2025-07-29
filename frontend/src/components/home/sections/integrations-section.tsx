'use client';

import { useState } from 'react';
import { MessageSquare, Mail, FileSpreadsheet, StickyNote, Instagram, Calendar, Slack, Trello, ArrowRight } from 'lucide-react';
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
    icon: <MessageSquare className="w-6 h-6" />,
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
    icon: <Mail className="w-6 h-6" />,
    color: 'bg-red-500',
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
    icon: <FileSpreadsheet className="w-6 h-6" />,
    color: 'bg-green-600',
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
    icon: <StickyNote className="w-6 h-6" />,
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
    icon: <Instagram className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
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
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Integre tudo. Automatize qualquer coisa.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            O Prophet conecta seus apps favoritos e cria automações inteligentes que economizam horas do seu dia.
          </p>
        </div>

        {/* Integration Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {integrations.map((integration) => (
            <button
              key={integration.id}
              onClick={() => setSelectedIntegration(integration)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                selectedIntegration.id === integration.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center text-white`}>
                {integration.icon}
              </div>
              <span className="font-medium">{integration.name}</span>
            </button>
          ))}
        </div>

        {/* Examples Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {selectedIntegration.examples.map((example, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {example.persona}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{example.title}</h3>
                <p className="text-muted-foreground text-sm">{example.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Essas são apenas algumas possibilidades. O Prophet se adapta ao seu fluxo de trabalho.
          </p>
          <button className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg hover:bg-primary/90 transition-colors">
            Comece a automatizar agora
          </button>
        </div>
      </div>
    </section>
  );
}