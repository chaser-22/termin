import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Termin",
    short_name: "Termin",
    description: "Online zakazivanje za salone, berbernice i ordinacije.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f6f3",
    theme_color: "#0e5a63",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
