import { Metadata } from 'next';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: `Create Agent | ${BRANDING.company} ${BRANDING.name}`,
  description: 'Create an agent',
  openGraph: {
    title: `Create Agent | ${BRANDING.company} ${BRANDING.name}`,
    description: 'Create an agent',
    type: 'website',
  },
};

export default async function NewAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
