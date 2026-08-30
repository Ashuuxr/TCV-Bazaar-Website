import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Public stall snapshot — visible layout, no admin-only fields (notes, customer_name, held_by). */
export const listStalls = createServerFn({ method: "GET" }).handler(
  async () => {
    const url =
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      console.warn("[stalls] Supabase configuration is unavailable");
      return [];
    }
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (
            key.startsWith("sb_") &&
            h.get("Authorization") === `Bearer ${key}`
          )
            h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data, error } = await supabase
      .from("stalls")
      .select(
        "id, label, zone, x, y, w, h, pkg_id, status, active, price_override, color, sort_order",
      )
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.warn("[stalls] Could not load active stalls", error.message);
      return [];
    }
    return data ?? [];
  },
);
