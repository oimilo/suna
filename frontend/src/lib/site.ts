import { BRANDING } from './branding';

export const siteConfig = {
  name: BRANDING.name,
  url: BRANDING.url,
  description: BRANDING.description,
  links: {
    twitter: BRANDING.social.twitter,
    github: BRANDING.social.github,
    linkedin: BRANDING.social.linkedin,
    discord: BRANDING.social.discord,
    instagram: BRANDING.social.instagram,
    email: BRANDING.supportEmail,
  },
  hero: {
    title: BRANDING.name,
    description: BRANDING.description,
  },
  footerLinks: [
    {
      title: 'Produto',
      links: [
        { title: 'Integrações', url: '#integrations' },
        { title: 'Preços', url: '#pricing' },
        { title: 'Como funciona', url: '#how-it-works' },
      ],
    },
    {
      title: 'Suporte',
      links: [
        { title: 'Documentação', url: '/docs' },
        { title: 'Contato', url: BRANDING.contactEmail ? `mailto:${BRANDING.contactEmail}` : '#' },
        { title: 'FAQ', url: '#faq' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { title: 'Privacidade', url: BRANDING.legal.privacy },
        { title: 'Termos', url: BRANDING.legal.terms },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
