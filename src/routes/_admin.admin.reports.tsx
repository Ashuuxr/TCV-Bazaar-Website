import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/Reports";

export const Route = createFileRoute("/_admin/admin/reports")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Reports" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
