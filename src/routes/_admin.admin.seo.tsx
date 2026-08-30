import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/Seo";

export const Route = createFileRoute("/_admin/admin/seo")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Seo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
