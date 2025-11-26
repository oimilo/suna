import type { NextConfig } from 'next';

const nextConfig = (): NextConfig => ({
  output: (process.env.NEXT_OUTPUT as 'standalone') || undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'assets-global.website-files.com',
      },
    ],
  },
  
  // PostHog rewrites removed - now configured directly via env vars
  // If you need proxy mode for ad-blockers, re-add rewrites matching your NEXT_PUBLIC_POSTHOG_HOST
  skipTrailingSlashRedirect: true,
});

export default nextConfig;
