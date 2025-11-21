import { Metadata } from 'next';
import { BRANDING, getPageTitle } from '@/lib/branding';

const title = getPageTitle('API Keys');
const description = `Manage your API keys for programmatic access to ${BRANDING.name}`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default async function APIKeysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
