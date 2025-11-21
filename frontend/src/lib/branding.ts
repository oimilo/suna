export const BRANDING = {
  name: 'Prophet',
  defaultAgentName: 'Prophet',
  description:
    'Plataforma de automação inteligente que conecta suas ferramentas favoritas usando linguagem natural.',
  url: 'https://prophet.build',
  company: 'Milo',
  teamName: 'Milo Team',
  supportEmail: 'support@milo.com',
  companyUrl: 'https://oimilo.com',
  contactEmail: 'start@prophet.build',
  careersUrl: 'https://oimilo.com/careers',
  logo: {
    light: '/preto.svg',
    dark: '/branco.svg',
    favicon: '/symbol.svg',
  },
  social: {
    twitter: 'https://twitter.com/oimilo',
    github: 'https://github.com/oimilo/prophet',
    discord: 'https://discord.gg/milo',
    linkedin: 'https://www.linkedin.com/company/milo/',
    instagram: 'https://instagram.com/oimilo',
  },
  legal: {
    privacy: 'https://prophet.build/legal?tab=privacy',
    terms: 'https://prophet.build/legal?tab=terms',
    license: 'https://github.com/oimilo/prophet/blob/main/LICENSE',
  },
  features: {
    showPoweredBy: true,
    allowSignup: true,
    showPricing: true,
  },
  calendarLink: 'team/milo/demo',
  legalEntity: {
    name: 'Milo Corp',
    address: 'São Paulo, SP, Brasil',
    email: 'legal@oimilo.com',
  },
};

export const getPageTitle = (pageTitle?: string) =>
  pageTitle ? `${pageTitle} | ${BRANDING.name}` : BRANDING.name;

export const getMetaDescription = (pageDescription?: string) =>
  pageDescription || BRANDING.description;
