import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnalyticsEventName = "page_view" | "layout_click";

type AnalyticsMetadata = Record<string, string | number | boolean | null>;

export type AnalyticsSummary = {
  visitors7d: number;
  pageViews7d: number;
  layoutClicks7d: number;
  daily: Array<{ day: string; label: string; pageViews: number }>;
};

function validateEvent(input: {
  eventName: AnalyticsEventName;
  path?: string;
  sessionId?: string | null;
  metadata?: AnalyticsMetadata;
}) {
  const path = (input.path ?? "/").trim();
  const sessionId = input.sessionId?.trim() || null;
  if (!["page_view", "layout_click"].includes(input.eventName))
    throw new Error("Invalid analytics event");
  if (path.length < 1 || path.length > 500)
    throw new Error("Invalid analytics path");
  if (sessionId && (sessionId.length < 8 || sessionId.length > 120))
    throw new Error("Invalid analytics session");
  return {
    eventName: input.eventName,
    path,
    sessionId,
    metadata: input.metadata ?? {},
  };
}

/** Public, best-effort event capture. Never exposes analytics rows to visitors. */
export const recordAnalyticsEvent = createServerFn({ method: "POST" })
  .validator(
    (input: {
      eventName: AnalyticsEventName;
      path?: string;
      sessionId?: string | null;
      metadata?: AnalyticsMetadata;
    }) => validateEvent(input),
  )
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } =
        await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("analytics_events").insert({
        event_name: data.eventName,
        path: data.path,
        session_id: data.sessionId,
        metadata: data.metadata,
      });
      if (error) return { ok: false as const };
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

export const getAnalyticsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsSummary> => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await context.supabase
      .from("analytics_events")
      .select("event_name, session_id, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(10000);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<{
      event_name: AnalyticsEventName;
      session_id: string | null;
      created_at: string;
    }>;
    const pageViews = rows.filter((row) => row.event_name === "page_view");
    const visitors = new Set(
      pageViews.map((row) => row.session_id).filter(Boolean),
    ).size;
    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      return {
        day: key,
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        pageViews: pageViews.filter(
          (row) => row.created_at.slice(0, 10) === key,
        ).length,
      };
    });

    return {
      visitors7d: visitors,
      pageViews7d: pageViews.length,
      layoutClicks7d: rows.filter((row) => row.event_name === "layout_click")
        .length,
      daily,
    };
  });

/** Admin-only, analytics-only reset. Bookings, payments, customers and invoices are untouched. */
export const resetAnalyticsData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: deleted, error } = await (context.supabase as any).rpc(
      "reset_analytics_events",
    );
    if (error) throw new Error(error.message);

    await (context.supabase as any)
      .rpc("log_user_audit", {
        _target_id: context.userId,
        _target_email: null,
        _action: "analytics.reset",
        _from_role: null,
        _to_role: null,
        _metadata: {
          deleted_events: Number(deleted ?? 0),
          scope: "analytics_events_only",
        },
      })
      .then(
        () => undefined,
        () => undefined,
      );

    return { ok: true as const, deleted: Number(deleted ?? 0) };
  });
