import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Done Swiping",
    short_name: "Done Swiping",
    description:
      "Voice-first compatibility matching based on who you are, not how you photograph.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfaf7",
    theme_color: "#d85f58",
    orientation: "portrait",
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
