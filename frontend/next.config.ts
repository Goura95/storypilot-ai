import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Keep browser requests same-origin. Next forwards them to FastAPI, which
    // avoids a browser CORS failure when the UI is served from another host.
    const backendUrl = (
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000"
    ).replace(/\/$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
