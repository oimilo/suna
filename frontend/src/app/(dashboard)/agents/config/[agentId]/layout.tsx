import { Metadata } from 'next';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: `Criar Agente | ${BRANDING.company} ${BRANDING.name}`,
  description: 'Criar um agente',
  openGraph: {
    title: `Criar Agente | ${BRANDING.company} ${BRANDING.name}`,
    description: 'Criar um agente',
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
