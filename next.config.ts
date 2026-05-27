import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.EXPORT_MODE === "true" ? "export" : "standalone",
  images: {
    unoptimized: process.env.EXPORT_MODE === "true" ? true : undefined,
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Force reload to pick up new Prisma models
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
