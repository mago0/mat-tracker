import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ensure pino is properly included in standalone build
  serverExternalPackages: ["pino"],
};

export default nextConfig;
