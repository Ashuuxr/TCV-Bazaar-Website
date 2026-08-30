import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/UserAuditLog";

export const Route = createFileRoute("/_admin/admin/audit")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Audit Log" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
