import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ShieldAlert,
  Trash2,
  Save,
  PlugZap,
  CheckCircle2,
  XCircle,
  CircleDashed,
} from "lucide-react";
import {
  listAllTrackingIntegrations,
  upsertTrackingIntegration,
  deleteTrackingIntegration,
  TRACKING_ID_RE,
  type TrackingProvider,
  type TrackingRow,
} from "@/lib/tracking.functions";

interface Meta {
  provider: TrackingProvider;
  name: string;
  hint: string;
  placeholder: string;
  optional?: boolean;
  isCustom?: boolean;
}

const PROVIDERS: Meta[] = [
  {
    provider: "meta_pixel",
    name: "Meta (Facebook) Pixel",
    hint: "15-16 digit Pixel ID",
    placeholder: "1234567890123456",
  },
  {
    provider: "ga4",
    name: "Google Analytics 4",
    hint: "Measurement ID",
    placeholder: "G-XXXXXXXXXX",
  },
  {
    provider: "gtm",
    name: "Google Tag Manager",
    hint: "Container ID",
    placeholder: "GTM-XXXXXX",
  },
  {
    provider: "google_ads",
    name: "Google Ads Conversion",
    hint: "AW-XXXXXXXXX",
    placeholder: "AW-1234567890",
  },
  {
    provider: "clarity",
    name: "Microsoft Clarity",
    hint: "Project ID",
    placeholder: "abcdefghij",
    optional: true,
  },
  {
    provider: "tiktok",
    name: "TikTok Pixel",
    hint: "Pixel ID (starts with C)",
    placeholder: "CXXXXXXXXXXXXXXXXXXX",
    optional: true,
  },
  {
    provider: "linkedin",
    name: "LinkedIn Insight Tag",
    hint: "Partner ID",
    placeholder: "1234567",
    optional: true,
  },
  {
    provider: "custom",
    name: "Custom Tracking Script",
    hint: "Inline script body (no <script> tags)",
    placeholder: '// e.g. myPixel && myPixel("init","ABC")',
    isCustom: true,
  },
];

interface Draft {
  enabled: boolean;
  tracking_id: string;
  custom_code: string;
  load_on_admin: boolean;
  saving?: boolean;
  deleting?: boolean;
  savedAt?: string;
  hasRow?: boolean;
}

function emptyDraft(): Draft {
  return {
    enabled: false,
    tracking_id: "",
    custom_code: "",
    load_on_admin: false,
  };
}

function initialDrafts(): Record<TrackingProvider, Draft> {
  return Object.fromEntries(
    PROVIDERS.map((p) => [p.provider, emptyDraft()]),
  ) as Record<TrackingProvider, Draft>;
}

export default function TrackingPixels() {
  const [drafts, setDrafts] =
    useState<Record<TrackingProvider, Draft>>(initialDrafts);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const rows: TrackingRow[] = await listAllTrackingIntegrations();
      const next = initialDrafts();
      for (const r of rows) {
        next[r.provider] = {
          enabled: r.enabled,
          tracking_id: r.tracking_id ?? "",
          custom_code: r.custom_code ?? "",
          load_on_admin: r.load_on_admin,
          savedAt: r.updated_at,
          hasRow: true,
        };
      }
      setDrafts(next);
      setForbidden(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (/forbidden/i.test(msg) || /super admin/i.test(msg))
        setForbidden(true);
      else toast.error("Could not load tracking integrations");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const patchRow = (p: TrackingProvider, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [p]: { ...d[p], ...patch } }));

  const save = async (m: Meta) => {
    const d = drafts[m.provider];
    if (m.isCustom) {
      if (!d.custom_code.trim()) {
        toast.error("Custom code cannot be empty");
        return;
      }
    } else {
      const id = d.tracking_id.trim();
      if (!id) {
        toast.error(m.name + ": enter a Tracking ID");
        return;
      }
      const re =
        TRACKING_ID_RE[m.provider as Exclude<TrackingProvider, "custom">];
      if (!re.test(id)) {
        toast.error(m.name + ": invalid ID format");
        return;
      }
    }
    patchRow(m.provider, { saving: true });
    try {
      await upsertTrackingIntegration({
        data: {
          provider: m.provider,
          enabled: d.enabled,
          tracking_id: m.isCustom ? null : d.tracking_id.trim(),
          custom_code: m.isCustom ? d.custom_code : null,
          load_on_admin: d.load_on_admin,
        },
      });
      toast.success(m.name + " saved");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      patchRow(m.provider, { saving: false });
    }
  };

  const remove = async (m: Meta) => {
    if (!drafts[m.provider].hasRow) {
      setDrafts((d) => ({ ...d, [m.provider]: emptyDraft() }));
      return;
    }
    if (!confirm("Remove " + m.name + "? Tracking will stop across the site."))
      return;
    patchRow(m.provider, { deleting: true });
    try {
      await deleteTrackingIntegration({ data: { provider: m.provider } });
      toast.success(m.name + " removed");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
      patchRow(m.provider, { deleting: false });
    }
  };

  const testConn = async (m: Meta) => {
    const d = drafts[m.provider];
    if (m.isCustom) {
      try {
        new Function(d.custom_code);
        toast.success("Custom code parses OK");
      } catch {
        toast.error("Custom code has a syntax error");
      }
      return;
    }
    const id = d.tracking_id.trim();
    const re =
      TRACKING_ID_RE[m.provider as Exclude<TrackingProvider, "custom">];
    if (!re.test(id)) {
      toast.error("ID format is invalid");
      return;
    }
    const url = probeUrl(m.provider, id);
    if (!url) {
      toast.success("Format valid");
      return;
    }
    try {
      await fetch(url, { mode: "no-cors" });
      toast.success(m.name + ": reachable");
    } catch {
      toast.error(m.name + ": could not reach vendor endpoint");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (forbidden) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card-bg)] p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 text-xl font-semibold">Super Admin only</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            You need the Super Admin role to view or edit Tracking Pixels.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tracking Pixels &amp; Marketing Integrations
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Add, edit, enable or remove marketing tags. Changes propagate to the
          public website in real time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {PROVIDERS.map((m) => {
          const d = drafts[m.provider];
          const status = statusFor(d, m);
          return (
            <div
              key={m.provider}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card-bg)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StatusDot kind={status.kind} />
                  <div>
                    <div className="font-semibold">
                      {m.name}
                      {m.optional && (
                        <span className="ml-2 text-xs font-normal text-[var(--ink-soft)]">
                          (optional)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--ink-soft)]">
                      {status.label}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) =>
                      patchRow(m.provider, { enabled: e.target.checked })
                    }
                  />
                  <span>{d.enabled ? "Enabled" : "Disabled"}</span>
                </label>
              </div>

              <div className="mt-4 grid gap-3">
                {m.isCustom ? (
                  <label className="block">
                    <div className="mb-1 text-xs font-medium text-[var(--ink-soft)]">
                      {m.hint}
                    </div>
                    <textarea
                      value={d.custom_code}
                      onChange={(e) =>
                        patchRow(m.provider, { custom_code: e.target.value })
                      }
                      placeholder={m.placeholder}
                      className="min-h-[140px] w-full rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] p-3 font-mono text-xs"
                    />
                  </label>
                ) : (
                  <label className="block">
                    <div className="mb-1 text-xs font-medium text-[var(--ink-soft)]">
                      {m.hint}
                    </div>
                    <input
                      value={d.tracking_id}
                      onChange={(e) =>
                        patchRow(m.provider, { tracking_id: e.target.value })
                      }
                      placeholder={m.placeholder}
                      className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-3 py-2 text-sm"
                    />
                  </label>
                )}
                <label className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <input
                    type="checkbox"
                    checked={d.load_on_admin}
                    onChange={(e) =>
                      patchRow(m.provider, { load_on_admin: e.target.checked })
                    }
                  />
                  Also load on Admin Dashboard (usually leave off)
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => save(m)}
                  disabled={d.saving}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#17130c] disabled:opacity-50"
                >
                  {d.saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}{" "}
                  Save
                </button>
                <button
                  onClick={() => testConn(m)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium"
                >
                  <PlugZap className="h-4 w-4" /> Test connection
                </button>
                {d.hasRow && (
                  <button
                    onClick={() => remove(m)}
                    disabled={d.deleting}
                    className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
                  >
                    {d.deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}{" "}
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusFor(
  d: Draft,
  m: Meta,
): { kind: "connected" | "disabled" | "none" | "invalid"; label: string } {
  const hasValue = m.isCustom ? !!d.custom_code.trim() : !!d.tracking_id.trim();
  if (!d.hasRow && !hasValue) return { kind: "none", label: "Not configured" };
  if (!m.isCustom && hasValue) {
    const re =
      TRACKING_ID_RE[m.provider as Exclude<TrackingProvider, "custom">];
    if (!re.test(d.tracking_id.trim()))
      return { kind: "invalid", label: "Invalid ID format" };
  }
  if (d.enabled && hasValue)
    return { kind: "connected", label: "Connected · loading on the website" };
  return { kind: "disabled", label: "Disabled" };
}

function StatusDot({
  kind,
}: {
  kind: "connected" | "disabled" | "none" | "invalid";
}) {
  if (kind === "connected")
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (kind === "invalid") return <XCircle className="h-5 w-5 text-red-500" />;
  if (kind === "disabled")
    return <CircleDashed className="h-5 w-5 text-amber-500" />;
  return <CircleDashed className="h-5 w-5 text-[var(--ink-soft)]" />;
}

function probeUrl(p: TrackingProvider, id: string): string | null {
  switch (p) {
    case "meta_pixel":
      return (
        "https://www.facebook.com/tr?id=" +
        encodeURIComponent(id) +
        "&ev=PageView&noscript=1"
      );
    case "ga4":
    case "google_ads":
      return (
        "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id)
      );
    case "gtm":
      return (
        "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id)
      );
    case "clarity":
      return "https://www.clarity.ms/tag/" + encodeURIComponent(id);
    case "tiktok":
      return (
        "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" +
        encodeURIComponent(id)
      );
    case "linkedin":
      return "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    default:
      return null;
  }
}
