import type { MetadataRoute } from "next";
import { getPublishedEvents } from "../lib/public-events";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://ccco.pt/", changeFrequency: "weekly", priority: 1 },
    { url: "https://ccco.pt/protecao-de-dados", changeFrequency: "yearly", priority: 0.2 },
  ];
  const events = await getPublishedEvents();
  return [
    ...staticPages,
    ...events.map((event) => ({
      url: `https://ccco.pt/eventos/${event.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
