import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Keys | Prophet',
  description: 'Manage your API keys for programmatic access to Prophet',
  openGraph: {
    title: 'API Keys | Prophet',
    description: 'Manage your API keys for programmatic access to Prophet',
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
