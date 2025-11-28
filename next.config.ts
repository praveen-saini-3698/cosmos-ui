import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable image optimization for Electron (we're not serving from a CDN)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
