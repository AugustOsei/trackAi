import type { MetadataRoute } from "next";

const BASE_URL = "https://trackai.theaugustdispatch.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private (admin/moderate) or single-use token pages (subscribe
      // confirm/unsubscribe) — nothing here is meant to be indexed, and the
      // token pages already carry their own noindex meta as a second layer.
      disallow: ["/admin", "/moderate", "/subscribe", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
