import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ccco.pt/",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://ccco.pt/protecao-de-dados",
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
