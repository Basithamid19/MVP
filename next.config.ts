import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  experimental: {
    // Next 15 defaults to no client-side cache for dynamic routes, which means
    // every repeat visit to /dashboard, /account, /messages re-runs the RSC
    // query even if the user just came from there. Caching for 60s makes
    // repeat nav within a browsing session feel instant (like the edge-cached
    // /home and /browse pages) while still refreshing on longer sessions.
    staleTimes: {
      dynamic: 60,
      static: 180,
    },
  },
};

export default nextConfig;
