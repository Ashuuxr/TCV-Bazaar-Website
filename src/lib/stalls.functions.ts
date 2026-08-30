import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StallStatus =
  | "available"
  | "reserved"
  | "pending"
  | "booked"
  | "blocked"
  | "sold";

export interface DbStall {
  id: string;
  event_id: string;
  label: string;
  zone: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  pkg_id: string | null;
  status: StallStatus;
  active: boolean;
  price_override: number | null;
  notes: string | null;
  color: string | null;
  sort_order: number;
  customer_name?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: admin role required");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapDbError(prefix: string, error: any): Error {
  const code = error?.code ? ` [${error.code}]` : "";
  const details = error?.details ? ` — ${error.details}` : "";
  return new Error(
    `${prefix}${code}: ${error?.message ?? "unknown"}${details}`,
  );
}

/** Admin: full stall rows including private fields (notes, customer_name). */
export const adminListStalls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("stalls")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as DbStall[];
  });

function sanitizePatch(raw: unknown) {
  const p = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const passthrough = [
    "label",
    "zone",
    "pkg_id",
    "status",
    "notes",
    "color",
    "customer_name",
  ] as const;
  for (const k of passthrough) if (k in p) out[k] = p[k] === "" ? null : p[k];
  for (const k of ["x", "y", "w", "h", "sort_order"] as const)
    if (k in p) out[k] = Number(p[k]);
  if ("price_override" in p)
    out.price_override =
      p.price_override === null || p.price_override === ""
        ? null
        : Number(p.price_override);
  if ("active" in p) out.active = !!p.active;
  return out;
}

export const createStall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    if (!r.id || typeof r.id !== "string") throw new Error("id required");
    if (!r.label || typeof r.label !== "string")
      throw new Error("label required");
    return {
      id: r.id,
      label: r.label,
      patch: sanitizePatch(r),
    };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data: evRow } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (!evRow?.id) throw new Error("No active event");
    const insert = {
      id: data.id,
      label: data.label,
      event_id: evRow?.id,
      x: 40,
      y: 60,
      w: 20,
      h: 5,
      status: "available" as const,
      active: true,
      sort_order: 0,
      ...data.patch,
    } as never;
    const { data: row, error } = await supabaseAdmin
      .from("stalls")
      .insert(insert)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as DbStall;
  });

export const updateStall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { id?: string; patch?: unknown };
    if (!r.id) throw new Error("id required");
    return { id: r.id, patch: sanitizePatch(r.patch) };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("stalls")
      .update(data.patch as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw wrapDbError(`updateStall(${data.id})`, error);
    return row as unknown as DbStall;
  });

export const bulkUpdateStalls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { items?: unknown };
    if (!Array.isArray(r.items)) throw new Error("items required");
    const items = r.items
      .map((it) => {
        const o = it as { id?: string; patch?: unknown };
        if (!o?.id) return null;
        return { id: o.id, patch: sanitizePatch(o.patch) };
      })
      .filter((x): x is { id: string; patch: Record<string, unknown> } => !!x);
    return { items };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    // Parallel updates keep this single-round-trip on the client and cheap on the server.
    const results = await Promise.all(
      data.items.map(async (it) => {
        const res = await supabaseAdmin
          .from("stalls")
          .update(it.patch as never)
          .eq("id", it.id)
          .select("id")
          .single();
        return { id: it.id, error: res.error };
      }),
    );
    const failed = results.filter((r) => r.error);
    if (failed.length) {
      const summary = failed
        .slice(0, 3)
        .map((f) => `${f.id}: ${f.error?.message}`)
        .join("; ");
      throw new Error(
        `bulkUpdateStalls: ${failed.length}/${results.length} rows failed — ${summary}`,
      );
    }
    return { ok: true, updated: results.length };
  });

/** Admin: single-round-trip upsert of layout geometry + sort order for the whole board. */
export const saveStallLayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { items?: unknown };
    if (!Array.isArray(r.items)) throw new Error("items required");
    const items = r.items
      .map((it) => {
        const o = it as Record<string, unknown>;
        if (!o?.id || typeof o.id !== "string") return null;
        return {
          id: o.id,
          x: Number(o.x ?? 0),
          y: Number(o.y ?? 0),
          w: Number(o.w ?? 10),
          h: Number(o.h ?? 10),
          sort_order: Number(o.sort_order ?? o.sortOrder ?? 0),
        };
      })
      .filter(
        (
          x,
        ): x is {
          id: string;
          x: number;
          y: number;
          w: number;
          h: number;
          sort_order: number;
        } => !!x,
      );
    return { items };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (!data.items.length) return { ok: true, updated: 0 };
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const results = await Promise.all(
      data.items.map(async (it) => {
        const { error } = await supabaseAdmin
          .from("stalls")
          .update({
            x: it.x,
            y: it.y,
            w: it.w,
            h: it.h,
            sort_order: it.sort_order,
          } as never)
          .eq("id", it.id);
        return { id: it.id, error };
      }),
    );
    const failed = results.filter((r) => r.error);
    if (failed.length) {
      const summary = failed
        .slice(0, 3)
        .map((f) => `${f.id}: ${f.error?.message}`)
        .join("; ");
      throw new Error(
        `saveStallLayout: ${failed.length}/${results.length} rows failed — ${summary}`,
      );
    }
    return { ok: true, updated: results.length };
  });

export const deleteStall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { id?: string };
    if (!r.id) throw new Error("id required");
    return { id: r.id };
  })
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("delete_stall_safe", {
      _stall_id: data.id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
