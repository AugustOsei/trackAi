import type { MetadataRoute } from "next";
import { getAllModelSlugsForSitemap } from "@/lib/queries";

const BASE_URL = "https://trackai.theaugustdispatch.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const models = await getAllModelSlugsForSitemap();

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/reports`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/submit`, changeFrequency: "monthly", priority: 0.4 },
    ...models.map((m) => ({
      url: `${BASE_URL}/models/${m.slug}`,
      lastModified: m.claimUpdatedAt ?? undefined,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
