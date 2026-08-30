import { createFileRoute } from "@tanstack/react-router";
import Page from "@/screens/admin/GalleryManager";

export const Route = createFileRoute("/_admin/admin/gallery")({
  head: () => ({
    meta: [
      { title: "TCV Bazaar Admin — GalleryManager" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
