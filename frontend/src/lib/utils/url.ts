const DAYTONA_PROXY_BASE = process.env.NEXT_PUBLIC_DAYTONA_PREVIEW_BASE_URL?.replace(
  /\/$/,
  '',
);

// Regex to extract sandbox ID from Daytona preview URLs
const DAYTONA_HOST_REGEX =
  /^https?:\/\/\d+-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.proxy\.daytona\.works/i;

/**
 * Extracts sandbox ID from a Daytona sandbox URL.
 */
function extractSandboxIdFromUrl(sandboxUrl: string): string | undefined {
  const match = DAYTONA_HOST_REGEX.exec(sandboxUrl);
  return match?.[1];
}

/**
 * Constructs a preview URL for HTML files in the sandbox environment.
 * Routes through the Prophet proxy for security and CORS handling.
 * Properly handles URL encoding of file paths by encoding each path segment individually.
 *
 * @param sandboxUrl - The base URL of the sandbox (Daytona URL)
 * @param filePath - The path to the HTML file (can include /workspace/ prefix)
 * @param sandboxId - Optional sandbox ID (if not provided, will be extracted from sandboxUrl)
 * @returns The properly encoded proxy preview URL, or undefined if inputs are invalid
 */
export function constructHtmlPreviewUrl(
  sandboxUrl: string | undefined,
  filePath: string | undefined,
  sandboxId?: string,
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

  // Try to use proxy if available
  const effectiveSandboxId = sandboxId || extractSandboxIdFromUrl(sandboxUrl);
  if (DAYTONA_PROXY_BASE && effectiveSandboxId) {
    return `${DAYTONA_PROXY_BASE}/${effectiveSandboxId}/${encodedPath}`;
  }

  // Fallback to direct URL if proxy not configured
  return `${sandboxUrl}/${encodedPath}`;
}
