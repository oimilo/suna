import { Metadata } from 'next';
import { BRANDING, getPageTitle } from '@/lib/branding';

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId: templateId } = await params;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/templates/public/${templateId}`);
    
    if (!response.ok) {
      throw new Error('Template not found');
    }
    
    const template = await response.json();
    const templateTitle = `${template.name} - AI Agent Template`;
    const title = getPageTitle(templateTitle);
    const description =
      template.description ||
      `Discover and install this AI agent template to enhance your workflow with ${BRANDING.company} ${BRANDING.name}.`;
    
    const ogImage = `${process.env.NEXT_PUBLIC_URL}/api/og/template?shareId=${templateId}`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${process.env.NEXT_PUBLIC_URL}/templates/${templateId}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: template.name,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    return {
      title: getPageTitle('AI Agent Template'),
      description:
        `Discover and install AI agent templates to enhance your workflow with ${BRANDING.company} ${BRANDING.name}.`,
      openGraph: {
        title: getPageTitle('AI Agent Template'),
        description:
          `Discover and install AI agent templates to enhance your workflow with ${BRANDING.company} ${BRANDING.name}.`,
        type: 'website',
        url: `${process.env.NEXT_PUBLIC_URL}/templates/${templateId}`,
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_URL}/share-page/og-fallback.png`,
            width: 1200,
            height: 630,
            alt: `${BRANDING.company} ${BRANDING.name} AI Agent Template`,
          }
        ],
      },
    };
  }
}

export default function TemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 