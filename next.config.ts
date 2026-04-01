import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      "geist",
      "framer-motion",
      "@hugeicons/react",
      "recharts",
      "@react-pdf/renderer",
    ],
  },
};

export default nextConfig;
