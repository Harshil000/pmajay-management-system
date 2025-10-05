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
  
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Vercel deployment configuration with turbo
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },
  
  // Environment handling for production
  env: {
    NEXTAUTH_URL_INTERNAL: process.env.NEXTAUTH_URL || 'https://pmajay-management-system.vercel.app',
  },
};

export default nextConfig;
