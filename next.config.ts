import type { NextConfig } from "next";

const backendApiUrl = (process.env.API_URL ?? "http://localhost:3000/api").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
