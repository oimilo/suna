import { Metadata } from 'next';
import { siteConfig } from '@/lib/site';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: ['Prophet', 'Prophet AI', 'Milo', 'AI', 'Agent', 'Open Source', 'AI assistant', 'generalist AI worker'],
  authors: [
    {
      name: BRANDING.teamName,
      url: BRANDING.companyUrl,
    },
  ],
  creator: BRANDING.teamName,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: '@prophetbuild',
    images: ['/banner.png'],
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
