import { agentPlaygroundFlagFrontend } from '@/flags';
import { isFlagEnabled } from '@/lib/feature-flags';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: `Conversa do Agente | ${BRANDING.company} ${BRANDING.name}`,
  description: `Conversa interativa do agente com ${BRANDING.company} ${BRANDING.name}`,
  openGraph: {
    title: `Conversa do Agente | ${BRANDING.company} ${BRANDING.name}`,
    description: `Conversa interativa do agente com ${BRANDING.company} ${BRANDING.name}`,
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
