import { createFileRoute } from "@tanstack/react-router";
import Gallery from "@/screens/public/Gallery";

export const Route = createFileRoute("/_public/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — TCV Bazaar Past Editions" },
      {
        name: "description",
        content:
          "Premium tents, lantern evenings, Diwali fireworks and festive shopping — a look back at TCV Bazaar.",
      },
      { property: "og:title", content: "Gallery — TCV Bazaar Past Editions" },
      {
        property: "og:description",
        content:
          "Premium tents, lantern evenings, Diwali fireworks and festive shopping — a look back at TCV Bazaar.",
      },
      { property: "og:url", content: "https://tcvbazaar.com/gallery" },
    ],
    links: [{ rel: "canonical", href: "https://tcvbazaar.com/gallery" }],
  }),
  component: () => <Gallery />,
});
