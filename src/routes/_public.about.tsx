import { createFileRoute } from "@tanstack/react-router";
import About from "@/screens/public/About";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "About TCV Bazaar — Gwalior's Premium Exhibition Platform" },
      {
        name: "description",
        content:
          "TCV Bazaar is where Gwalior comes together to celebrate — a curated Diwali marketplace of premium brands, food, music and festive shopping.",
      },
      {
        property: "og:title",
        content: "About TCV Bazaar — Gwalior's Premium Exhibition Platform",
      },
      {
        property: "og:description",
        content:
          "TCV Bazaar is where Gwalior comes together to celebrate — a curated Diwali marketplace of premium brands, food, music and festive shopping.",
      },
      { property: "og:url", content: "https://www.tcvbazaar.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://www.tcvbazaar.com/about" }],
  }),
  component: () => <About />,
});
