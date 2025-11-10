import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Agent Conversation | Prophet',
  description: 'Interactive agent conversation powered by Prophet',
  openGraph: {
    title: 'Agent Conversation | Prophet',
    description: 'Interactive agent conversation powered by Prophet',
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
