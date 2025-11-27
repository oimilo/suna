import { config } from '@/lib/config';

interface UpgradePlan {
  /** @deprecated */
  hours: string;
  price: string;
  tierKey: string;  // Backend tier key
}

export interface PricingTier {
  name: string;
  price: string;
  yearlyPrice?: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  isPopular: boolean;
  /** @deprecated */
  hours?: string;
  features: string[];
  disabledFeatures?: string[];
  baseCredits?: number;
  bonusCredits?: number;
  tierKey: string;  // Backend tier key (e.g., 'tier_2_20', 'free')
  upgradePlans: UpgradePlan[];
  hidden?: boolean;
  billingPeriod?: 'monthly' | 'yearly';
  originalYearlyPrice?: string;
  discountPercentage?: number;
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Basic',
    price: '$0',
    yearlyPrice: '$0',
    originalYearlyPrice: '$0',
    discountPercentage: 0,
    description: 'Perfeito para começar',
    buttonText: 'Selecionar',
    buttonColor: 'bg-secondary text-white',
    isPopular: false,
    hours: '0 hours',
    features: [
      '200 créditos diários - Renova a cada 24 horas (aplica-se a todos os planos)',
      '1 execução simultânea',
      '10 Chats no total',
      'Modo Básico - Experiência Prophet com autonomia básica',
    ],
    disabledFeatures: [
      'Sem Trabalhadores IA customizados',
      'Sem triggers agendados',
      'Sem triggers de aplicativos',
      'Sem integrações',
    ],
    tierKey: config.SUBSCRIPTION_TIERS.FREE_TIER.tierKey,
    upgradePlans: [],
  },
  {
    name: 'Plus',
    price: '$20',
    yearlyPrice: '$204',
    originalYearlyPrice: '$240',
    discountPercentage: 15,
    description: 'Ideal para indivíduos e pequenas equipes',
    buttonText: 'Começar',
    buttonColor: 'bg-primary text-white dark:text-black',
    isPopular: false,
    hours: '2 hours',
    baseCredits: 2000,
    bonusCredits: 2000,
    features: [
      'CREDITS_BONUS:2000:4000',
      'Chats ilimitados',
      '3 execuções simultâneas - Execute múltiplos Chats ao mesmo tempo',
      '5 Trabalhadores IA - Crie Agentes Prophet com Knowledge, Tools & Integrações',
      '5 triggers agendados - Execute às 9h diariamente, toda segunda, início do mês...',
      '25 triggers de apps - Auto-responda emails, mensagens Slack, formulários...',
      '100+ Integrações - Google Drive, Slack, Notion, Gmail, Calendar, GitHub & mais',
      'Prophet Power Mode - Máxima autonomia e capacidade de decisão',
      'Suporte Básico',
    ],
    tierKey: config.SUBSCRIPTION_TIERS.TIER_2_20.tierKey,
    upgradePlans: [],
  },
  {
    name: 'Pro',
    price: '$50',
    yearlyPrice: '$510',
    originalYearlyPrice: '$600',
    discountPercentage: 15,
    description: 'Ideal para negócios em crescimento',
    buttonText: 'Começar',
    buttonColor: 'bg-secondary text-white',
    isPopular: false,
    hours: '6 hours',
    baseCredits: 5000,
    bonusCredits: 5000,
    features: [
      'CREDITS_BONUS:5000:10000',
      'Chats ilimitados',
      '5 execuções simultâneas - Execute múltiplos Chats ao mesmo tempo',
      '20 Trabalhadores IA - Crie Agentes Prophet com Knowledge, Tools & Integrações',
      '10 triggers agendados - Execute às 9h diariamente, toda segunda, início do mês...',
      '50 triggers de apps - Auto-responda emails, mensagens Slack, formulários...',
      '100+ Integrações - Google Drive, Slack, Notion, Gmail, Calendar, GitHub & mais',
      'Prophet Power Mode - Contexto estendido e raciocínio avançado',
      'Suporte Básico',
    ],
    tierKey: config.SUBSCRIPTION_TIERS.TIER_6_50.tierKey,
    upgradePlans: [],
  },
  {
    name: 'Business',
    price: '$100',
    yearlyPrice: '$1020',
    originalYearlyPrice: '$1200',
    discountPercentage: 15,
    description: 'Para empresas estabelecidas',
    buttonText: 'Começar',
    buttonColor: 'bg-secondary text-white',
    isPopular: false,
    hours: '12 hours',
    features: [
      '10.000 créditos/mês',
      '20 trabalhadores customizados',
      'Projetos privados',
      '100+ integrações',
      'Modelos IA Premium',
    ],
    tierKey: config.SUBSCRIPTION_TIERS.TIER_12_100.tierKey,
    upgradePlans: [],
    hidden: true,
  },
  {
    name: 'Ultra',
    price: '$200',
    yearlyPrice: '$2040',
    originalYearlyPrice: '$2400',
    discountPercentage: 15,
    description: 'Para usuários avançados',
    buttonText: 'Começar',
    buttonColor: 'bg-secondary text-white',
    isPopular: false,
    hours: '25 hours',
    baseCredits: 20000,
    bonusCredits: 20000,
    features: [
      'CREDITS_BONUS:20000:40000',
      'Chats ilimitados',
      '20 execuções simultâneas - Execute múltiplos Chats ao mesmo tempo',
      '100 Trabalhadores IA - Crie Agentes Prophet com Knowledge, Tools & Integrações',
      '50 triggers agendados - Execute às 9h diariamente, toda segunda, início do mês...',
      '200 triggers de apps - Auto-responda emails, mensagens Slack, formulários...',
      '100+ Integrações - Google Drive, Slack, Notion, Gmail, Calendar, GitHub & mais',
      'Prophet Power Mode - Máxima autonomia e capacidade de decisão',
      'Suporte Prioritário',
    ],
    tierKey: config.SUBSCRIPTION_TIERS.TIER_25_200.tierKey,
    upgradePlans: [],
  },
  {
    name: 'Enterprise',
    price: '$400',
    yearlyPrice: '$4080',
    originalYearlyPrice: '$4800',
    discountPercentage: 15,
    description: 'Para grandes equipes',
    buttonText: 'Começar',
    buttonColor: 'bg-secondary text-white',
    isPopular: false,
    hours: '50 hours',
    features: [
      '40.000 créditos/mês',
      'Projetos privados',
      '100+ integrações',
      'Modelos IA Premium',
      'Suporte prioritário',
    ],
    tierKey: config.SUBSCRIPTION_TIERS.TIER_50_400.tierKey,
    upgradePlans: [],
    hidden: true,
  },
  {
    name: 'Scale',
    price: '$800',
    yearlyPrice: '$8160',
    originalYearlyPrice: '$9600',
    discountPercentage: 15,
    description: 'Para equipes em escala',
    buttonText: 'Começar',
    buttonColor: 'bg-secondary text-white',
    isPopular: false,
    hours: '125 hours',
    features: [
      '80.000 créditos/mês',
      'Projetos privados',
      '100+ integrações',
      'Modelos IA Premium',
      'Suporte prioritário',
      'Gerente de conta dedicado',
    ],
    tierKey: config.SUBSCRIPTION_TIERS.TIER_125_800.tierKey,
    upgradePlans: [],
    hidden: true,
  },
  {
    name: 'Max',
    price: '$1000',
    yearlyPrice: '$10200',
    originalYearlyPrice: '$12000',
    discountPercentage: 15,
    description: 'Performance máxima',
    buttonText: 'Começar',
    buttonColor: 'bg-secondary text-white',
    isPopular: false,
    hours: '200 hours',
    features: [
      '100.000 créditos/mês',
      'Projetos privados',
      '100+ integrações',
      'Modelos IA Premium',
      'Suporte prioritário',
      'Gerente de conta dedicado',
      'Deploy customizado',
    ],
    tierKey: config.SUBSCRIPTION_TIERS.TIER_200_1000.tierKey,
    upgradePlans: [],
    hidden: true,
  },
];

