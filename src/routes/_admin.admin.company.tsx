import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/CompanySettings";

export const Route = createFileRoute("/_admin/admin/company")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Company & Billing" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
