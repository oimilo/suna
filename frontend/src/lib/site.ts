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
  },
};

export type SiteConfig = typeof siteConfig;
