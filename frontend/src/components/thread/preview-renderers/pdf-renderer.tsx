import React from 'react';
import { useAuth } from '@/components/AuthProvider';

interface PdfRendererProps {
  content?: string; // not used; kept for API parity
  previewUrl: string;
  className?: string;
}

export function PdfRenderer({ previewUrl, className }: PdfRendererProps) {
  const { session } = useAuth();
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let revokedUrl: string | null = null;
    async function load() {
      try {
        setError(null);
        const res = await fetch(previewUrl, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        revokedUrl = url;
        setBlobUrl(url);
      } catch (e: any) {
        setError(e?.message || 'Failed to load PDF');
      }
    }
    load();
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [previewUrl, session?.access_token]);

  if (error) {
    return (
      <div className={className}>
        <div className="h-full w-full flex items-center justify-center text-sm text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {blobUrl ? (
        <iframe
          src={blobUrl}
          className="w-full h-full border-0"
          title="PDF Preview"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
          Carregando PDF…
        </div>
      )}
    </div>
  );
}


