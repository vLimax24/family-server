import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use Turbopack for production builds
  turbopack: {},

  // Use webpack polling only in development
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
