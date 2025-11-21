import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Keys | Milo',
  description: 'Manage your API keys for programmatic access to Milo',
  openGraph: {
    title: 'API Keys | Milo',
    description: 'Manage your API keys for programmatic access to Milo',
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
