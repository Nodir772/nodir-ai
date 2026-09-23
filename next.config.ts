import type { NextConfig } from "next";

const PAGE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), payment=(), microphone=(self)",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth"],
  experimental: {
    cpus: 1,
  },
  async headers() {
    return [
      {
        source: "/((?!api/chat|api/ai/tool|api/voice).*)",
        headers: PAGE_SECURITY_HEADERS,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
