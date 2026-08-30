import { createFileRoute } from "@tanstack/react-router";
import WhyExhibit from "@/screens/public/WhyExhibit";

export const Route = createFileRoute("/_public/why-exhibit")({
  head: () => ({
    meta: [
      { title: "Why Exhibit at TCV Bazaar — Real Business for Real Brands" },
      {
        name: "description",
        content:
          "High footfall, premium audience, sales, leads, marketing support and brand visibility engineered for one outcome — real business for our exhibitors.",
      },
      {
        property: "og:title",
        content: "Why Exhibit at TCV Bazaar — Real Business for Real Brands",
      },
      {
        property: "og:description",
        content:
          "High footfall, premium audience, sales, leads, marketing support and brand visibility engineered for one outcome — real business for our exhibitors.",
      },
      { property: "og:url", content: "https://tcvbazaar.com/why-exhibit" },
    ],
    links: [{ rel: "canonical", href: "https://tcvbazaar.com/why-exhibit" }],
  }),
  component: () => <WhyExhibit />,
});
