import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/EventManager";

export const Route = createFileRoute("/_admin/admin/events")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — EventManager" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
