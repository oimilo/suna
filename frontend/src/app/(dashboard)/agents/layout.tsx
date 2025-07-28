import { agentPlaygroundFlagFrontend } from '@/flags';
import { isFlagEnabled } from '@/lib/feature-flags';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: `Agent Conversation | ${BRANDING.company} ${BRANDING.name}`,
  description: `Interactive agent conversation powered by ${BRANDING.company} ${BRANDING.name}`,
  openGraph: {
    title: `Agent Conversation | ${BRANDING.company} ${BRANDING.name}`,
    description: `Interactive agent conversation powered by ${BRANDING.company} ${BRANDING.name}`,
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
