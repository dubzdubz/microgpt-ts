import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["../microgpt", "../datasets"],
};

export default nextConfig;
