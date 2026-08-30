import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/Invoices";

export const Route = createFileRoute("/_admin/admin/invoices")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — Invoices" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
