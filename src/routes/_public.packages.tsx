import { createFileRoute } from "@tanstack/react-router";
import Packages from "@/screens/public/Packages";

export const Route = createFileRoute("/_public/packages")({
  head: () => ({
    meta: [
      { title: "Stall Packages — TCV Bazaar 2026 Diwali Edition" },
      {
        name: "description",
        content:
          "Compare stall packages for the Diwali Edition. Premium hot-spot, Standard, Sharing, Tabler and Branding Spots — pick the fit for your brand.",
      },
      {
        property: "og:title",
        content: "Stall Packages — TCV Bazaar 2026 Diwali Edition",
      },
      {
        property: "og:description",
        content:
          "Compare stall packages for the Diwali Edition. Premium hot-spot, Standard, Sharing, Tabler and Branding Spots — pick the fit for your brand.",
      },
      { property: "og:url", content: "https://tcvbazaar.com/packages" },
    ],
    links: [{ rel: "canonical", href: "https://tcvbazaar.com/packages" }],
  }),
  component: () => <Packages />,
});
