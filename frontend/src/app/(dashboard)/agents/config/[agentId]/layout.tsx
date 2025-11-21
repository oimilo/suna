import { Metadata } from 'next';
import { BRANDING, getPageTitle } from '@/lib/branding';

const title = getPageTitle('Create Agent');
const description = `Create a new agent in ${BRANDING.company}`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
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
