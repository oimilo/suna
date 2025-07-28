import { Metadata } from 'next';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: `App Profiles | ${BRANDING.company} ${BRANDING.name}`,
  description: 'Manage your connected app integrations',
  openGraph: {
    title: `App Profiles | ${BRANDING.company} ${BRANDING.name}`,
    description: 'Manage your connected app integrations',
    type: 'website',
  },
};

export default async function CredentialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
