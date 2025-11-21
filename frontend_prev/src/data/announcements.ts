'use client';

import { BRANDING } from '@/lib/branding';
import type { BaseAnnouncement } from '@/hooks/use-announcement-store';

export const DEFAULT_ANNOUNCEMENTS: Array<Omit<BaseAnnouncement, 'id' | 'timestamp'>> = [
  {
    type: 'feature-launch',
    title: `${BRANDING.company} Templates v2`,
    description: 'Nova galeria com filtros e previews para instalar agentes curados pela equipe Milo em um clique.',
    priority: 'high',
    persistent: true,
    metadata: {
      slug: 'templates-v2',
      tag: 'Templates',
      icon: 'sparkles',
    },
    actions: [
      {
        id: 'open-templates',
        label: 'Explorar templates',
        href: '/templates',
      },
      {
        id: 'docs-templates',
        label: 'Ver guia',
        href: '/docs/introduction',
      },
    ],
  },
  {
    type: 'product-update',
    title: 'Trial com métricas em tempo real',
    description: 'Acompanhe consumo de créditos e uso diário direto do dashboard com alertas preventivos.',
    priority: 'medium',
    persistent: true,
    metadata: {
      slug: 'trial-metrics',
      tag: 'Billing',
      icon: 'chart',
    },
    actions: [
      {
        id: 'view-billing',
        label: 'Abrir billing',
        href: '/settings/billing',
      },
    ],
  },
  {
    type: 'ai-agents-mcp',
    title: `Workflows e MCP integrados ao ${BRANDING.name}`,
    description: 'Combine Playbooks, triggers e registros Composio para automatizar equipes inteiras.',
    priority: 'high',
    persistent: true,
    metadata: {
      slug: 'workflows-mcp',
      tag: 'Automação',
      icon: 'workflow',
    },
    actions: [
      {
        id: 'learn-workflows',
        label: 'Ver exemplos',
        href: '/dashboard?agent_id=default',
      },
      {
        id: 'docs-workflows',
        label: 'Documentação',
        href: '/docs/architecture',
      },
    ],
  },
];


