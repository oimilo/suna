import posthog from 'posthog-js';

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  // Use NEXT_PUBLIC_POSTHOG_HOST to configure region (default: US)
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  const uiHost = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://us.posthog.com';
  
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: posthogHost,
    ui_host: uiHost,
    defaults: '2025-05-24',
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
  });
}
