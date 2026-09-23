import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const BASE = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/chat", "/settings", "/onboarding", "/favorites"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
