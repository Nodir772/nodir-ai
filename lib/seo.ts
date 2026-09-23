import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const SITE_DESCRIPTION = `Nodir AI — ${SITE_TAGLINE} O'zbek tilidagi sun'iy intellekt yordamchisi: chat, kod, yozish, tarjima va hujjatlar.`;

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://nodir.ai";
  return raw.replace(/\/$/, "");
}

export function siteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url,
        description: SITE_DESCRIPTION,
        inLanguage: "uz",
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url,
        logo: `${url}/icon`,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url,
        description: SITE_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };
}
