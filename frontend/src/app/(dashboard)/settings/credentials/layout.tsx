import { Metadata } from 'next';
import { BRANDING, getPageTitle } from '@/lib/branding';

const title = getPageTitle('App Profiles');
const description = 'Manage your connected app integrations';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
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
