export type PersonaOption = {
  id: string;
  title: string;
  description: string;
};

export const goalOptions: PersonaOption[] = [
  {
    id: 'launch-presence',
    title: 'Lançar minha presença digital',
    description: 'Criar algo rápido que represente meu produto ou serviço.',
  },
  {
    id: 'sell-online',
    title: 'Vender ou captar leads',
    description: 'Transformar visitantes em oportunidades de negócio.',
  },
  {
    id: 'understand-data',
    title: 'Entender métricas e dados',
    description: 'Ter uma visão clara da performance para tomar decisões.',
  },
  {
    id: 'automate-ops',
    title: 'Automatizar operações',
    description: 'Poupar tempo com fluxos que acontecem automaticamente.',
  },
];

export const focusOptions: PersonaOption[] = [
  {
    id: 'web-experience',
    title: 'Experiência Web',
    description: 'Landing pages, formulários e conteúdos visuais.',
  },
  {
    id: 'sales-funnel',
    title: 'Funil de vendas',
    description: 'Nutrição de leads, outbound e conversões.',
  },
  {
    id: 'analysis',
    title: 'Análises e relatórios',
    description: 'Dashboards, métricas e monitoramento contínuo.',
  },
  {
    id: 'automation',
    title: 'Automações',
    description: 'Integrações, rotinas repetitivas e orquestração.',
  },
];

export const toneOptions: PersonaOption[] = [
  {
    id: 'visionary',
    title: 'Visionário',
    description: 'Mensagens inspiradoras, foco em storytelling.',
  },
  {
    id: 'analytical',
    title: 'Analítico',
    description: 'Fatos, métricas e explicações diretas.',
  },
  {
    id: 'pragmatic',
    title: 'Pragmático',
    description: 'Orientado a ação, direto ao ponto.',
  },
];

export const profileByGoalFocus: Record<string, string> = {
  'launch-presence:web-experience': 'website-showcase',
  'launch-presence:sales-funnel': 'website-general',
  'launch-presence:analysis': 'analytics',
  'launch-presence:automation': 'automation',
  'sell-online:web-experience': 'ecommerce',
  'sell-online:sales-funnel': 'ecommerce',
  'sell-online:analysis': 'analytics',
  'sell-online:automation': 'automation',
  'understand-data:web-experience': 'analytics',
  'understand-data:sales-funnel': 'analytics',
  'understand-data:analysis': 'analytics',
  'understand-data:automation': 'automation',
  'automate-ops:web-experience': 'automation',
  'automate-ops:sales-funnel': 'automation',
  'automate-ops:analysis': 'automation',
  'automate-ops:automation': 'automation',
};

export const personaLabels = {
  goal: Object.fromEntries(goalOptions.map((option) => [option.id, option.title])),
  focus: Object.fromEntries(focusOptions.map((option) => [option.id, option.title])),
  tone: Object.fromEntries(toneOptions.map((option) => [option.id, option.title])),
};


