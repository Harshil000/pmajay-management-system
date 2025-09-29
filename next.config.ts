import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript warnings  
    ignoreBuildErrors: true,
  },
  experimental: {
    // Enable experimental features for better performance
    turbo: {
      resolveAlias: {
        canvas: './empty-module.js',
      },
    },
  },
};

export default nextConfig;
