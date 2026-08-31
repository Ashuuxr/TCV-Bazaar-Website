import { createFileRoute } from "@tanstack/react-router";
import Policy from "@/screens/public/Policy";

export const Route = createFileRoute("/_public/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — TCV Bazaar" },
      {
        name: "description",
        content: "Cancellation and refund terms for TCV Bazaar stall bookings.",
      },
      { property: "og:title", content: "Refund Policy — TCV Bazaar" },
      {
        property: "og:description",
        content: "Cancellation and refund terms for TCV Bazaar stall bookings.",
      },
      { property: "og:url", content: "https://www.tcvbazaar.com/refund-policy" },
    ],
    links: [{ rel: "canonical", href: "https://www.tcvbazaar.com/refund-policy" }],
  }),
  component: () => <Policy kind={"refund"} />,
});
