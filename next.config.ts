import type { NextConfig } from "next";

const nextConfig = {
  // The face models never change: let the browser keep them for a year so the
  // 7 MB are downloaded only once per device (big speed-up of the Face ID pages).
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
