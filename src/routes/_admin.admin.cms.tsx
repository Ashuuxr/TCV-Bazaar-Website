import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/Cms";

export const Route = createFileRoute("/_admin/admin/cms")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Cms" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
