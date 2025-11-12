type CaptureContext = {
  tags?: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';
const SENTRY_ENV =
  process.env.NEXT_PUBLIC_SENTRY_ENV ??
  process.env.NEXT_PUBLIC_RUNTIME_ENV ??
  process.env.NODE_ENV ??
  'development';

const SDK_INFO = {
  name: 'suna.presentation-viewer',
  version: '1.0.0',
};

const makeUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }

  // Fallback UUID generator
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const buildEnvelope = (payload: unknown) => {
  const header = JSON.stringify({
    sent_at: new Date().toISOString(),
    sdk: SDK_INFO,
    dsn: SENTRY_DSN,
  });

  const itemHeader = JSON.stringify({
    type: 'event',
    content_type: 'application/json',
  });

  return `${header}\n${itemHeader}\n${JSON.stringify(payload)}`;
};

export async function captureClientException(
  error: unknown,
  context: CaptureContext = {},
) {
  try {
    if (!SENTRY_DSN || typeof window === 'undefined') {
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown presentation viewer error';

    const stack =
      error instanceof Error
        ? error.stack
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : undefined;

    const eventPayload = {
      event_id: makeUUID(),
      timestamp: new Date().toISOString(),
      level: 'error' as const,
      platform: 'javascript',
      environment: SENTRY_ENV,
      logger: 'presentation-viewer',
      message,
      tags: {
        ...(context.tags ?? {}),
      },
      extra: {
        ...(context.extra ?? {}),
        stack,
      },
    };

    const envelope = buildEnvelope(eventPayload);
    const monitoringEndpoint = '/monitoring';

    if (navigator.sendBeacon) {
      const blob = new Blob([envelope], {
        type: 'application/x-sentry-envelope',
      });
      navigator.sendBeacon(monitoringEndpoint, blob);
      return;
    }

    await fetch(monitoringEndpoint, {
      method: 'POST',
      body: envelope,
      keepalive: true,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    });
  } catch (sendError) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[PresentationViewer] Failed to send Sentry event',
        sendError,
      );
    }
  }
}

