import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/StallManager";

export const Route = createFileRoute("/_admin/admin/stalls")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — StallManager" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
