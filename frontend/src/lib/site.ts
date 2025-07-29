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
        { title: 'Integrações', url: '/#integrations' },
        { title: 'Preços', url: '/#pricing' },
        { title: 'Empresas', url: BRANDING.contactEmail ? `mailto:${BRANDING.contactEmail}` : '#' },
      ],
    },
    {
      title: 'Recursos',
      links: [
        { title: 'Como funciona', url: '/#how-it-works' },
        { title: 'Suporte', url: BRANDING.supportEmail ? `mailto:${BRANDING.supportEmail}` : '#' },
        { title: 'Status', url: '#' },
      ],
    },
    {
      title: 'Empresa',
      links: [
        { title: 'Sobre', url: BRANDING.companyUrl },
        { title: 'Blog', url: `${BRANDING.companyUrl}/blog` },
        { title: 'Contato', url: BRANDING.contactEmail ? `mailto:${BRANDING.contactEmail}` : '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { title: 'Privacidade', url: BRANDING.legal.privacy },
        { title: 'Termos', url: BRANDING.legal.terms },
        { title: 'Segurança', url: '#' },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
