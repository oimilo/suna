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
      title: 'Product',
      links: [
        { title: 'Features', url: '/#features' },
        { title: 'Pricing', url: '/#pricing' },
        { title: 'Enterprise', url: BRANDING.contactEmail ? `mailto:${BRANDING.contactEmail}` : '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { title: 'Documentation', url: 'https://docs.suna.so' },
        { title: 'Community', url: BRANDING.social.discord },
        { title: 'Support', url: BRANDING.supportEmail ? `mailto:${BRANDING.supportEmail}` : '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { title: 'About', url: BRANDING.companyUrl },
        { title: 'Blog', url: `${BRANDING.companyUrl}/blog` },
        { title: 'Careers', url: BRANDING.careersUrl },
      ],
    },
    {
      title: 'Legal',
      links: [
        { title: 'Privacy', url: BRANDING.legal.privacy },
        { title: 'Terms', url: BRANDING.legal.terms },
        { title: 'License', url: BRANDING.legal.license },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
