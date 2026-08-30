import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/Dashboard";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Dashboard" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
