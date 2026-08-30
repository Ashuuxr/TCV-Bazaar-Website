import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/VersionHistory";

export const Route = createFileRoute("/_admin/admin/history")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Version History" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
