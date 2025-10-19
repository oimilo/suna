import React from 'react';
import { useAuth } from '@/components/AuthProvider';

interface XlsxRendererProps {
  content?: string; // unused, API parity
  previewUrl: string;
  className?: string;
}

export function XlsxRenderer({ previewUrl, className }: XlsxRendererProps) {
  const { session } = useAuth();
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let revoke: string | null = null;
    async function load() {
      try {
        setError(null);
        const res = await fetch(previewUrl, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        revoke = url;
        setBlobUrl(url);
      } catch (e: any) {
        setError(e?.message || 'Failed to load file');
      }
    }
    load();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [previewUrl, session?.access_token]);

  return (
    <div className={className}>
      {error ? (
        <div className="h-full w-full flex items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-sm">
          <div className="text-muted-foreground">Sem preview para planilhas. Baixe para abrir.</div>
          {blobUrl ? (
            <a
              href={blobUrl}
              download
              className="px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            >
              Baixar .xlsx
            </a>
          ) : (
            <div className="text-muted-foreground">Carregando…</div>
          )}
        </div>
      )}
    </div>
  );
}


