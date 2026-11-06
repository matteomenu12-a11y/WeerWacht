import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output includes only production runtime dependencies for smaller Node hosts.
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
