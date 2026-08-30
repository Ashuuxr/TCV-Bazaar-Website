import { createFileRoute } from "@tanstack/react-router";
import Policy from "@/screens/public/Policy";

export const Route = createFileRoute("/_public/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TCV Bazaar" },
      {
        name: "description",
        content:
          "How TCV Bazaar (The City Vibes Marketing) collects, uses and protects your booking and payment data.",
      },
      { property: "og:title", content: "Privacy Policy — TCV Bazaar" },
      {
        property: "og:description",
        content:
          "How TCV Bazaar (The City Vibes Marketing) collects, uses and protects your booking and payment data.",
      },
      { property: "og:url", content: "https://tcvbazaar.com/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "https://tcvbazaar.com/privacy-policy" }],
  }),
  component: () => <Policy kind={"privacy"} />,
});
