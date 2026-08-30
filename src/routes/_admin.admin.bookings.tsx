import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/BookingManager";

export const Route = createFileRoute("/_admin/admin/bookings")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — BookingManager" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
