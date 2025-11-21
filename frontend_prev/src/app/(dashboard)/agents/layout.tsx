import { Metadata } from 'next';
import { BRANDING, getPageTitle, getMetaDescription } from '@/lib/branding';

const title = getPageTitle('Agent Conversation');
const description = `${BRANDING.company} agent conversation powered by ${BRANDING.name}`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
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
