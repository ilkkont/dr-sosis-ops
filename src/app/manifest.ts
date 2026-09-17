import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dr.Sosis Operasyon Paneli",
    short_name: "Dr.Sosis Panel",
    description:
      "Dr.Sosis karavanları için stok, satış ve etkinlik operasyon paneli.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#08090b",
    theme_color: "#08090b",
    lang: "tr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
