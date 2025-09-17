import { Metadata } from 'next';
import { getThread, getProject } from '@/lib/api-server';
import { BRANDING } from '@/lib/branding';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { threadId } = await params;
  const fallbackMetaData = {
    title: `Conversa Compartilhada | ${BRANDING.company} ${BRANDING.name}`,
    description: `Reproduza esta conversa do Agente em ${BRANDING.company} ${BRANDING.name}`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_URL}/share/${threadId}`,
    },
    openGraph: {
      title: `Conversa Compartilhada | ${BRANDING.company} ${BRANDING.name}`,
      description: `Reproduza esta conversa do Agente em ${BRANDING.company} ${BRANDING.name}`,
      images: [`${process.env.NEXT_PUBLIC_URL}/share-page/og-fallback.png`],
    },
  };

  try {
    const threadData = await getThread(threadId);
    const projectData = await getProject(threadData.project_id);

    if (!threadData || !projectData) {
      return fallbackMetaData;
    }

    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENV_MODE === 'LOCAL' ||
      process.env.NEXT_PUBLIC_ENV_MODE === 'local';

    const title = projectData.name || `Conversa Compartilhada | ${BRANDING.company} ${BRANDING.name}`;
    const description =
      projectData.description ||
      `Reproduza esta conversa do Agente em ${BRANDING.company} ${BRANDING.name}`;
    const ogImage = isDevelopment
      ? `${process.env.NEXT_PUBLIC_URL}/share-page/og-fallback.png`
      : `${process.env.NEXT_PUBLIC_URL}/api/share-page/og-image?title=${projectData.name}`;

    return {
      title,
      description,
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_URL}/share/${threadId}`,
      },
      openGraph: {
        title,
        description,
        images: [ogImage],
      },
      twitter: {
        title,
        description,
        images: ogImage,
        card: 'summary_large_image',
      },
    };
  } catch (error) {
    return fallbackMetaData;
  }
}

export default async function ThreadLayout({ children }) {
  return <>{children}</>;
}
