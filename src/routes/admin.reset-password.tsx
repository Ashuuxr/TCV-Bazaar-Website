import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/screens/admin/ResetPassword";

export const Route = createFileRoute("/admin/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — TCV Bazaar" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPassword,
});
