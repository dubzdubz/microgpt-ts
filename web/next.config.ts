import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: {
    // Fail the build on any compiler diagnostic
    panicThreshold: 'all_errors',
  },
  transpilePackages: ["../microgpt", "../datasets"],
};

export default nextConfig;
