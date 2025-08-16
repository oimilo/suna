import { Metadata } from 'next';
import { siteConfig } from '@/lib/site';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: [`${BRANDING.company} ${BRANDING.name}`, 'AI', 'Agent'],
  authors: [
    {
      name: `${BRANDING.company} AI Corp`,
      url: BRANDING.companyUrl,
    },
  ],
  creator: `${BRANDING.company} AI Corp`,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: BRANDING.social.twitter.replace('https://twitter.com/', '@'),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
