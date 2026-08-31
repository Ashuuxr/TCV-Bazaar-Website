import { createFileRoute } from "@tanstack/react-router";
import Testimonials from "@/screens/public/Testimonials";

export const Route = createFileRoute("/_public/testimonials")({
  head: () => ({
    meta: [
      { title: "Exhibitor Testimonials — TCV Bazaar" },
      {
        name: "description",
        content:
          "What Gwalior's boutique owners, jewellers, food brands and creators say about exhibiting with TCV Bazaar.",
      },
      { property: "og:title", content: "Exhibitor Testimonials — TCV Bazaar" },
      {
        property: "og:description",
        content:
          "What Gwalior's boutique owners, jewellers, food brands and creators say about exhibiting with TCV Bazaar.",
      },
      { property: "og:url", content: "https://www.tcvbazaar.com/testimonials" },
    ],
    links: [{ rel: "canonical", href: "https://www.tcvbazaar.com/testimonials" }],
  }),
  component: () => <Testimonials />,
});
