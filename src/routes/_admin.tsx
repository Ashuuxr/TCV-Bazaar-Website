import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@/screens/admin/Layout";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});
