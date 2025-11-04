/**
 * Constructs a preview URL for HTML files in the sandbox environment.
 * Properly handles URL encoding of file paths by encoding each path segment individually.
 *
 * @param sandboxUrl - The base URL of the sandbox
 * @param filePath - The path to the HTML file (can include /workspace/ prefix)
 * @returns The properly encoded preview URL, or undefined if inputs are invalid
 */
export function constructHtmlPreviewUrl(
  sandboxUrl: string | undefined,
  filePath: string | undefined,
): string | undefined {
  if (!sandboxUrl || !filePath) {
    return undefined;
  }

  // Remove /workspace/ prefix if present
  const processedPath = filePath.replace(/^\/workspace\//, '');

  // Split the path into segments and encode each segment individually
  const pathSegments = processedPath
    .split('/')
    .map((segment) => encodeURIComponent(segment));

  // Join the segments back together with forward slashes
  const encodedPath = pathSegments.join('/');

  return `${sandboxUrl}/${encodedPath}`;
}

/**
 * Constructs a proxied preview URL that goes through our backend preview endpoint.
 * This is necessary to embed sandbox content within the workspace iframe without cross-origin issues.
 *
 * @param projectId - Unique project identifier used by the preview proxy
 * @param port - Target sandbox port to proxy (defaults to undefined to allow caller fallbacks)
 * @param filePath - Optional file path to append under the proxied URL
 */
import { BRANDING } from '@/lib/branding';

function normalizeBrandUrl(): string | null {
  const raw = (BRANDING.url || '').trim();
  if (!raw) {
    return null;
  }

  const candidate = raw.startsWith('http') ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    return parsed.origin;
  } catch {
    return null;
  }
}

export function constructProjectPreviewProxyUrl(
  projectId: string | undefined,
  port: number | undefined,
  filePath?: string,
): string | undefined {
  if (!projectId || !port) {
    return undefined;
  }

  const brandOrigin = normalizeBrandUrl();
  const basePath = `/api/preview/${projectId}/p/${port}`;
  const base = brandOrigin ? `${brandOrigin}${basePath}` : basePath;

  if (!filePath) {
    return `${base}/`;
  }

  const processedPath = filePath
    .replace(/^\/workspace\//, '')
    .replace(/^\/+/, '');

  const encodedSegments = processedPath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));

  return `${base}/${encodedSegments.join('/')}`;
}

export function constructProjectPreviewFileUrl(
  projectId: string | undefined,
  filePath?: string,
): string | undefined {
  if (!projectId) {
    return undefined;
  }

  const brandOrigin = normalizeBrandUrl();
  const basePath = `/api/preview/${projectId}`;
  const base = brandOrigin ? `${brandOrigin}${basePath}` : basePath;

  if (!filePath) {
    return `${base}/`;
  }

  const processedPath = filePath
    .replace(/^\/workspace\//, '')
    .replace(/^\/+/, '');

  if (!processedPath) {
    return `${base}/`;
  }

  const encodedSegments = processedPath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));

  return `${base}/${encodedSegments.join('/')}`;
}

export function maskPreviewUrl(
  projectId: string | undefined,
  url: string | undefined,
): string | undefined {
  if (!projectId || !url) {
    return url;
  }

  if (!/^https?:\/\//i.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    const portMatch = hostname.match(/^(\d{2,5})-[A-Za-z0-9-]+\.proxy\.daytona\.works$/i);
    if (portMatch) {
      const port = Number(portMatch[1]);
      if (Number.isFinite(port)) {
        const proxied = constructProjectPreviewProxyUrl(
          projectId,
          port,
          parsed.pathname,
        );
        if (proxied) {
          return `${proxied}${parsed.search || ''}${parsed.hash || ''}`;
        }
      }
    }

    if (/\.proxy\.daytona\.works$/i.test(hostname)) {
      const proxiedFile = constructProjectPreviewFileUrl(
        projectId,
        parsed.pathname,
      );
      if (proxiedFile) {
        return `${proxiedFile}${parsed.search || ''}${parsed.hash || ''}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}
