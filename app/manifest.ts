import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nodir AI",
    short_name: "Nodir AI",
    description: "Nodir AI — o'zbek tilidagi sun'iy intellekt yordamchisi.",
    start_url: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    lang: "uz",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/icon", sizes: "512x512", type: "image/png" },
    ],
  };
}
