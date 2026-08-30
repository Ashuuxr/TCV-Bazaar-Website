import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/ContactMessages";

export const Route = createFileRoute("/_admin/admin/messages")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Contact Messages" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
