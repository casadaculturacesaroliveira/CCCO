import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Casa da Cultura César Oliveira",
    short_name: "CCCO",
    description: "Programação e cultura na Casa da Cultura César Oliveira.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/ccco-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
  };
}
