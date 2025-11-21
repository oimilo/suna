import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Agent Conversation | Milo',
  description: 'Interactive agent conversation powered by Milo',
  openGraph: {
    title: 'Agent Conversation | Milo',
    description: 'Interactive agent conversation powered by Milo',
    type: 'website',
  },
};

export default async function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
