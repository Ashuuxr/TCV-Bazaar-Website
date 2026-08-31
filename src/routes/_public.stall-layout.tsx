import { createFileRoute } from "@tanstack/react-router";
import StallLayout from "@/screens/public/StallLayout";

export const Route = createFileRoute("/_public/stall-layout")({
  head: () => ({
    meta: [
      { title: "Interactive Stall Layout — TCV Bazaar 2026" },
      {
        name: "description",
        content:
          "See live stall availability on our interactive Diwali floor plan. Click any stall to reserve it while you complete your booking.",
      },
      {
        property: "og:title",
        content: "Interactive Stall Layout — TCV Bazaar 2026",
      },
      {
        property: "og:description",
        content:
          "See live stall availability on our interactive Diwali floor plan. Click any stall to reserve it while you complete your booking.",
      },
      { property: "og:url", content: "https://www.tcvbazaar.com/stall-layout" },
    ],
    links: [{ rel: "canonical", href: "https://www.tcvbazaar.com/stall-layout" }],
  }),
  component: () => <StallLayout />,
});
