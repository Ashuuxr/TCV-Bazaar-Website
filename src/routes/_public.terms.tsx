import { createFileRoute } from "@tanstack/react-router";
import Policy from "@/screens/public/Policy";

export const Route = createFileRoute("/_public/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — TCV Bazaar" },
      {
        name: "description",
        content: "Terms and conditions for exhibitors at TCV Bazaar events.",
      },
      { property: "og:title", content: "Terms & Conditions — TCV Bazaar" },
      {
        property: "og:description",
        content: "Terms and conditions for exhibitors at TCV Bazaar events.",
      },
      { property: "og:url", content: "https://www.tcvbazaar.com/terms" },
    ],
    links: [{ rel: "canonical", href: "https://www.tcvbazaar.com/terms" }],
  }),
  component: () => <Policy kind={"terms"} />,
});
