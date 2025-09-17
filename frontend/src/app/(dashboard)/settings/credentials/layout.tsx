import { Metadata } from 'next';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: `Perfis de Aplicativos | ${BRANDING.company} ${BRANDING.name}`,
  description: 'Gerencie suas integrações de aplicativos conectados',
  openGraph: {
    title: `Perfis de Aplicativos | ${BRANDING.company} ${BRANDING.name}`,
    description: 'Gerencie suas integrações de aplicativos conectados',
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
