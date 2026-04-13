import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {
    optimizePackageImports: [
      "geist",
      "framer-motion",
      "@hugeicons/react",
      "recharts",
    ],
  },
};

export default nextConfig;
