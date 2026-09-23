import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const BASE = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/pricing", "/about", "/login", "/register", "/privacy", "/terms"].map((path) => ({
    url: `${BASE}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
