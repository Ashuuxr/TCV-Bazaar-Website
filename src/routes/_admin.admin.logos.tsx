import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/LogoManager";

export const Route = createFileRoute("/_admin/admin/logos")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Logo Manager" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
