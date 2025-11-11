const previewProxyBase = process.env.NEXT_PUBLIC_DAYTONA_PREVIEW_BASE_URL
  ? process.env.NEXT_PUBLIC_DAYTONA_PREVIEW_BASE_URL.replace(/\/$/, '')
  : undefined;

type ProxyUrlOptions = {
  sandboxId?: string;
  sandboxUrl?: string;
  relativePath?: string;
  encodePathSegments?: boolean;
};

const trimLeadingSlash = (value: string): string => value.replace(/^\/+/, '');

const encodePath = (path: string, encodeSegments: boolean): string => {
  if (!path) return '';
  if (!encodeSegments) return trimLeadingSlash(path);

  return trimLeadingSlash(path)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
};

export function buildSandboxProxyUrl({
  sandboxId,
  sandboxUrl,
  relativePath,
  encodePathSegments = false,
}: ProxyUrlOptions): string | undefined {
  const normalizedPath = encodePath(relativePath ?? '', encodePathSegments);
  const pathSuffix = normalizedPath ? `/${normalizedPath}` : '';

  if (previewProxyBase && sandboxId) {
    return `${previewProxyBase}/${sandboxId}${pathSuffix}`;
  }

  if (sandboxUrl) {
    const base = sandboxUrl.replace(/\/$/, '');
    return `${base}${pathSuffix}`;
  }

  return undefined;
}

/**
 * Constructs a preview URL for HTML files in the sandbox environment using the Daytona proxy when available.
 */
export function constructHtmlPreviewUrl({
  sandboxId,
  sandboxUrl,
  filePath,
}: {
  sandboxId?: string;
  sandboxUrl?: string;
  filePath?: string;
}): string | undefined {
  if (!filePath) {
    return undefined;
  }

  const processedPath = filePath.replace(/^\/workspace\//, '');

  return buildSandboxProxyUrl({
    sandboxId,
    sandboxUrl,
    relativePath: processedPath,
    encodePathSegments: true,
  });
}
