import { Metadata } from 'next';
import { getThread, getProject } from '@/lib/api-server';
import { BRANDING, getPageTitle } from '@/lib/branding';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { threadId } = await params;
  const fallbackTitle = getPageTitle('Shared Conversation');
  const fallbackDescription = `Replay this agent conversation on ${BRANDING.company} ${BRANDING.name}`;
  const fallbackMetaData = {
    title: fallbackTitle,
    description: fallbackDescription,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_URL}/share/${threadId}`,
    },
    openGraph: {
      title: fallbackTitle,
      description: fallbackDescription,
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
      // process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENV_MODE === 'LOCAL' ||
      process.env.NEXT_PUBLIC_ENV_MODE === 'local';

    const title = projectData.name
      ? getPageTitle(projectData.name)
      : fallbackTitle;
    const description = projectData.description || fallbackDescription;
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
