import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Force reload to pick up new Prisma models
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
