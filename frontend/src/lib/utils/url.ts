// [PROPHET CUSTOM] Preview proxy base URL - routes through our backend instead of direct Daytona
const PREVIEW_PROXY_BASE = process.env.NEXT_PUBLIC_DAYTONA_PREVIEW_BASE_URL?.replace(/\/$/, '');

// Regex to extract sandbox ID from Daytona proxy URLs
const DAYTONA_SANDBOX_ID_REGEX = /^https?:\/\/\d+-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.proxy\.daytona\.works/i;

/**
 * Extracts sandbox ID from a Daytona proxy URL or sandbox URL
 */
export function extractSandboxId(sandboxUrl: string | undefined): string | undefined {
  if (!sandboxUrl) return undefined;
  
  // Try to extract from Daytona proxy URL format
  const match = DAYTONA_SANDBOX_ID_REGEX.exec(sandboxUrl);
  if (match?.[1]) return match[1];
  
  // Fallback: try to extract UUID pattern from URL
  const uuidMatch = sandboxUrl.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return uuidMatch?.[1];
}

/**
 * [PROPHET CUSTOM] Constructs a VNC preview URL, routing through proxy if configured.
 * This avoids the Daytona warning modal.
 */
export function constructVncPreviewUrl(
  vncPreviewUrl: string | undefined,
  password: string | undefined,
): string | undefined {
  if (!vncPreviewUrl || !password) return undefined;

  const sandboxId = extractSandboxId(vncPreviewUrl);
  
  // Use proxy if configured
  if (PREVIEW_PROXY_BASE && sandboxId) {
    return `${PREVIEW_PROXY_BASE}/${sandboxId}/vnc_lite.html?password=${password}&autoconnect=true&scale=local`;
  }

  // Fallback to direct URL (will show Daytona warning)
  return `${vncPreviewUrl}/vnc_lite.html?password=${password}&autoconnect=true&scale=local`;
}

/**
 * Constructs a preview URL for HTML files in the sandbox environment.
 * [PROPHET CUSTOM] Routes through our backend proxy to avoid Daytona warning modal.
 * Properly handles URL encoding of file paths by encoding each path segment individually.
 *
 * @param sandboxUrl - The base URL of the sandbox
 * @param filePath - The path to the HTML file (can include /workspace/ prefix, or be a full API URL)
 * @returns The properly encoded preview URL, or undefined if inputs are invalid
 */
export function constructHtmlPreviewUrl(
  sandboxUrl: string | undefined,
  filePath: string | undefined,
): string | undefined {
  if (!sandboxUrl || !filePath) {
    return undefined;
  }

  let processedPath = filePath;

  // If filePath is a full URL (API endpoint), extract the path parameter
  if (filePath.includes('://') || filePath.includes('/sandboxes/') || filePath.includes('/files/content')) {
    try {
      // Try to parse as URL if it's a full URL
      if (filePath.includes('://')) {
        const url = new URL(filePath);
        const pathParam = url.searchParams.get('path');
        if (pathParam) {
          processedPath = decodeURIComponent(pathParam);
        } else {
          // If no path param, try to extract from pathname
          // Handle patterns like /v1/sandboxes/.../files/content?path=...
          const pathMatch = filePath.match(/[?&]path=([^&]+)/);
          if (pathMatch) {
            processedPath = decodeURIComponent(pathMatch[1]);
          } else {
            // If it's a relative URL with /sandboxes/ pattern, extract the path
            const sandboxMatch = filePath.match(/\/sandboxes\/[^\/]+\/files\/content[?&]path=([^&]+)/);
            if (sandboxMatch) {
              processedPath = decodeURIComponent(sandboxMatch[1]);
            } else {
              // Can't extract path, return undefined
              return undefined;
            }
          }
        }
      } else {
        // Relative URL pattern: /sandboxes/.../files/content?path=...
        const pathMatch = filePath.match(/[?&]path=([^&]+)/);
        if (pathMatch) {
          processedPath = decodeURIComponent(pathMatch[1]);
        } else {
          // Can't extract path, return undefined
          return undefined;
        }
      }
    } catch (e) {
      // If URL parsing fails, treat as regular path
      console.warn('Failed to parse filePath as URL, treating as regular path:', filePath);
    }
  }

  // Remove /workspace/ prefix if present
  processedPath = processedPath.replace(/^\/workspace\//, '');

  // Split the path into segments and encode each segment individually
  const pathSegments = processedPath
    .split('/')
    .filter(Boolean) // Remove empty segments
    .map((segment) => encodeURIComponent(segment));

  // Join the segments back together with forward slashes
  const encodedPath = pathSegments.join('/');

  // [PROPHET CUSTOM] Use proxy if configured, otherwise fall back to direct URL
  const sandboxId = extractSandboxId(sandboxUrl);
  if (PREVIEW_PROXY_BASE && sandboxId) {
    return `${PREVIEW_PROXY_BASE}/${sandboxId}/${encodedPath}`;
  }

  // Fallback to direct sandbox URL (will show Daytona warning)
  return `${sandboxUrl}/${encodedPath}`;
}
