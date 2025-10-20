export type DaytonaBypassOptions = {
  unexpectedContentHandler?: (contentType: string | null) => void;
};

/**
 * Fetches a JSON resource from the sandbox, automatically bypassing Daytona preview warnings.
 * This ensures programmatic access works without manual confirmation dialogs.
 */
export async function fetchSandboxJsonWithWarningBypass<T>(
  url: string,
  options: DaytonaBypassOptions = {},
): Promise<T> {
  const attemptFetch = async (): Promise<Response> =>
    fetch(url, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
      },
      credentials: 'include',
    });

  let response = await attemptFetch();

  const contentType = response.headers.get('content-type');
  const looksLikeWarning =
    response.ok && contentType?.includes('text/html');

  if (looksLikeWarning) {
    try {
      const originalUrl = new URL(url);
      const acceptUrl = new URL('/accept-daytona-preview-warning', originalUrl);
      acceptUrl.searchParams.set('redirect', originalUrl.toString());

      const acceptResponse = await fetch(acceptUrl.toString(), {
        method: 'POST',
        credentials: 'include',
      });

      if (!acceptResponse.ok) {
        throw new Error(
          `Failed to bypass Daytona warning (${acceptResponse.status})`,
        );
      }

      response = await attemptFetch();
    } catch (warningError) {
      console.error('Daytona preview warning bypass failed:', warningError);
      throw warningError;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sandbox resource: ${response.status} ${response.statusText}`,
    );
  }

  const finalContentType = response.headers.get('content-type');
  if (!finalContentType?.includes('application/json')) {
    options.unexpectedContentHandler?.(finalContentType);
    throw new Error(
      `Unexpected content type from sandbox: ${finalContentType || 'unknown'}`,
    );
  }

  return response.json() as Promise<T>;
}
