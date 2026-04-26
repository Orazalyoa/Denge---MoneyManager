import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kaspi MVP Tracker",
    short_name: "Kaspi Tracker",
    description: "Paste Kaspi transactions, review drafts, and save locally.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fa",
    theme_color: "#f8f9fa",
    lang: "ru",
  };
}
