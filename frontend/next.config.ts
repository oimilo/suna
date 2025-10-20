import type { NextConfig } from 'next';

const nextConfig = (): NextConfig => ({
  output: (process.env.NEXT_OUTPUT as 'standalone') || undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets-global.website-files.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logos.composio.dev',
        pathname: '/**',
      },
    ],
  },
});

export default nextConfig;
