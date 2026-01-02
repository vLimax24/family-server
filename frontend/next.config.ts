import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Check for file changes every second
        aggregateTimeout: 300, // Wait 300ms after a change before rebuilding
      };
    }
    return config;
  },
};

export default nextConfig;
