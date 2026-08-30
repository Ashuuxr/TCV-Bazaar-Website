import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Receipt,
  Hash,
  RefreshCcw,
  Upload,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ACard, Field } from "./ui";
import {
  getBillingAccess,
  saveCompanyProfile,
  saveGstSettings,
  saveInvoiceSettings,
  resetInvoiceSeries,
  previewNextInvoiceNumber,
  createCompanyAssetUploadUrl,
  getCompanyProfileFull,
  type CompanyProfile,
  type GstSettings,
  type InvoiceSettings,
} from "@/lib/company.functions";

type TabKey = "company" | "gst" | "invoice";
const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "gst", label: "GST & Tax", icon: Receipt },
  { key: "invoice", label: "Invoice Numbering", icon: Hash },
];

const RATE_OPTIONS = [0, 5, 12, 18, 28];

function useTable<T extends { id: string }>(table: string, empty: T) {
  const [row, setRow] = useState<T>(empty);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from(table)
        .select("*")
        .eq("id", "main")
        .maybeSingle();
      if (cancel) return;
      if (data) setRow({ ...empty, ...(data as T) });
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`live-${table}`)

      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        load,
      )
      .subscribe();
    return () => {
      cancel = true;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
  return { row, setRow, loading };
}

export default function CompanySettings() {
  const [tab, setTab] = useState<TabKey>("company");
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const check = useServerFn(getBillingAccess);

  useEffect(() => {
    let cancel = false;
    check()
      .then((r) => {
        if (!cancel) setHasAccess(!!r.hasBillingAccess);
      })
      .catch(() => {
        if (!cancel) setHasAccess(false);
      });
    return () => {
      cancel = true;
    };
  }, [check]);

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--ink-soft)]">
        <Loader2 className="mr-2 animate-spin" size={16} /> Loading…
      </div>
    );
  }
  if (!hasAccess) {
    return (
      <ACard>
        <div className="flex items-start gap-3 p-4">
          <ShieldAlert className="text-amber-500" />
          <div>
            <h3 className="font-medium">Billing access required</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Your account needs the Super Admin, Admin, or Finance role to
              change these settings.
            </p>
          </div>
        </div>
      </ACard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">
          Company & Billing
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Company profile, GST/tax rules and invoice numbering used across every
          document.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t.key
                ? "border-[var(--gold)] text-[var(--ink)]"
                : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && <CompanyTab />}
      {tab === "gst" && <GstTab />}
      {tab === "invoice" && <InvoiceTab />}
    </div>
  );
}

/* -------------------- COMPANY TAB -------------------- */

const EMPTY_COMPANY: CompanyProfile = {
  id: "main",
  legal_name: "",
  business_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  state_code: "",
  pincode: "",
  country: "India",
  gstin: "",
  pan: "",
  cin: "",
  email: "",
  mobile: "",
  website: "",
  logo_url: "",
  signature_url: "",
  stamp_url: "",
  updated_at: "",
};

function CompanyTab() {
  const load = useServerFn(getCompanyProfileFull);
  const [row, setRow] = useState<CompanyProfile>(EMPTY_COMPANY);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    const refresh = () =>
      load()
        .then((data) => {
          if (!cancel && data)
            setRow({ ...EMPTY_COMPANY, ...(data as CompanyProfile) });
          if (!cancel) setLoading(false);
        })
        .catch(() => {
          if (!cancel) setLoading(false);
        });
    refresh();
    const ch = supabase
      .channel("live-company_profile")

      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "company_profile" },
        refresh,
      )
      .subscribe();
    return () => {
      cancel = true;
      supabase.removeChannel(ch);
    };
  }, [load]);
  const [saving, setSaving] = useState(false);
  const save = useServerFn(saveCompanyProfile);

  const set =
    (k: keyof CompanyProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setRow({ ...row, [k]: e.target.value });

  const submit = async () => {
    setSaving(true);
    try {
      await save({ data: row });
      toast.success("Company profile saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <ACard>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Legal Name">
          <input
            className="input-lux"
            value={row.legal_name}
            onChange={set("legal_name")}
            placeholder="TCV Bazaar Pvt. Ltd."
          />
        </Field>
        <Field label="Business / Trade Name">
          <input
            className="input-lux"
            value={row.business_name}
            onChange={set("business_name")}
            placeholder="TCV Bazaar"
          />
        </Field>
        <Field label="Address Line 1">
          <input
            className="input-lux"
            value={row.address_line1}
            onChange={set("address_line1")}
          />
        </Field>
        <Field label="Address Line 2">
          <input
            className="input-lux"
            value={row.address_line2}
            onChange={set("address_line2")}
          />
        </Field>
        <Field label="City">
          <input
            className="input-lux"
            value={row.city}
            onChange={set("city")}
          />
        </Field>
        <Field label="State">
          <input
            className="input-lux"
            value={row.state}
            onChange={set("state")}
            placeholder="Madhya Pradesh"
          />
        </Field>
        <Field label="State Code (GST)">
          <input
            className="input-lux"
            value={row.state_code}
            onChange={set("state_code")}
            placeholder="23"
            maxLength={2}
          />
        </Field>
        <Field label="Pincode">
          <input
            className="input-lux"
            value={row.pincode}
            onChange={set("pincode")}
            maxLength={6}
          />
        </Field>
        <Field label="Country">
          <input
            className="input-lux"
            value={row.country}
            onChange={set("country")}
          />
        </Field>
        <Field label="GSTIN">
          <input
            className="input-lux"
            value={row.gstin}
            onChange={(e) =>
              setRow({ ...row, gstin: e.target.value.toUpperCase() })
            }
            maxLength={15}
            placeholder="22AAAAA0000A1Z5"
          />
        </Field>
        <Field label="PAN">
          <input
            className="input-lux"
            value={row.pan}
            onChange={(e) =>
              setRow({ ...row, pan: e.target.value.toUpperCase() })
            }
            maxLength={10}
          />
        </Field>
        <Field label="CIN (optional)">
          <input className="input-lux" value={row.cin} onChange={set("cin")} />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className="input-lux"
            value={row.email}
            onChange={set("email")}
          />
        </Field>
        <Field label="Mobile">
          <input
            className="input-lux"
            value={row.mobile}
            onChange={set("mobile")}
            placeholder="+91 …"
          />
        </Field>
        <Field label="Website">
          <input
            className="input-lux"
            value={row.website}
            onChange={set("website")}
            placeholder="https://"
          />
        </Field>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <AssetUploader
          label="Logo"
          kind="logo"
          url={row.logo_url}
          onChange={(u) => setRow({ ...row, logo_url: u })}
        />
        <AssetUploader
          label="Signature"
          kind="signature"
          url={row.signature_url}
          onChange={(u) => setRow({ ...row, signature_url: u })}
        />
        <AssetUploader
          label="Company Stamp"
          kind="stamp"
          url={row.stamp_url}
          onChange={(u) => setRow({ ...row, stamp_url: u })}
        />
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="btn-gold rounded-full px-6 py-3 text-sm font-semibold"
        >
          {saving ? "Saving…" : "Save Company Profile"}
        </button>
      </div>
    </ACard>
  );
}

/* -------------------- GST TAB -------------------- */

const EMPTY_GST: GstSettings = {
  id: "main",
  gst_enabled: true,
  default_rate: 18,
  tax_mode: "cgst_sgst",
  home_state_code: "",
  auto_calculate: true,
  updated_at: "",
};

function GstTab() {
  const { row, setRow, loading } = useTable<GstSettings>(
    "gst_settings",
    EMPTY_GST,
  );
  const [saving, setSaving] = useState(false);
  const save = useServerFn(saveGstSettings);

  const preview = useMemo(() => {
    const sub = 10000;
    const gst = row.gst_enabled
      ? Math.round(sub * (row.default_rate / 100))
      : 0;
    return { sub, gst, total: sub + gst };
  }, [row]);

  const submit = async () => {
    setSaving(true);
    try {
      await save({ data: row });
      toast.success("GST settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <ACard title="Tax rules" sub="Applied to every new booking">
        <div className="space-y-5">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={row.gst_enabled}
              onChange={(e) =>
                setRow({ ...row, gst_enabled: e.target.checked })
              }
            />
            <span className="text-sm font-medium">GST enabled</span>
          </label>
          <Field label="Default GST rate">
            <div className="flex flex-wrap gap-2">
              {RATE_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRow({ ...row, default_rate: r })}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold ${row.default_rate === r ? "border-[var(--gold)] bg-[var(--gold)] text-[#17130c]" : "border-[var(--line)]"}`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tax mode">
            <div className="flex gap-2">
              {(["cgst_sgst", "igst"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRow({ ...row, tax_mode: m })}
                  className={`flex-1 rounded-xl border px-4 py-3 text-xs font-semibold ${row.tax_mode === m ? "border-[var(--gold)] bg-[var(--gold)] text-[#17130c]" : "border-[var(--line)]"}`}
                >
                  {m === "cgst_sgst"
                    ? "CGST + SGST (intra-state)"
                    : "IGST (inter-state)"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Home state code (for intra-state)">
            <input
              className="input-lux"
              maxLength={2}
              value={row.home_state_code}
              onChange={(e) =>
                setRow({ ...row, home_state_code: e.target.value })
              }
            />
          </Field>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={row.auto_calculate}
              onChange={(e) =>
                setRow({ ...row, auto_calculate: e.target.checked })
              }
            />
            <span className="text-sm">
              Auto-calculate GST on booking when GSTIN is provided
            </span>
          </label>
        </div>
      </ACard>
      <ACard title="Preview" sub="Sample of a ₹10,000 booking">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{preview.sub.toLocaleString("en-IN")}</span>
          </div>
          {row.tax_mode === "cgst_sgst" ? (
            <>
              <div className="flex justify-between">
                <span>CGST @ {row.default_rate / 2}%</span>
                <span>
                  ₹{Math.round(preview.gst / 2).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SGST @ {row.default_rate / 2}%</span>
                <span>
                  ₹{Math.round(preview.gst / 2).toLocaleString("en-IN")}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span>IGST @ {row.default_rate}%</span>
              <span>₹{preview.gst.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-[var(--line)] pt-3 text-base font-semibold">
            <span>Total</span>
            <span>₹{preview.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </ACard>
      <div className="xl:col-span-3 flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="btn-gold rounded-full px-6 py-3 text-sm font-semibold"
        >
          {saving ? "Saving…" : "Save GST settings"}
        </button>
      </div>
    </div>
  );
}

/* -------------------- INVOICE TAB -------------------- */

const EMPTY_INV: InvoiceSettings = {
  id: "main",
  prefix: "TCV",
  format: "{PREFIX}/{FY}/{SEQ}",
  seq_padding: 4,
  reset_yearly: true,
  updated_at: "",
};

function InvoiceTab() {
  const { row, setRow, loading } = useTable<InvoiceSettings>(
    "invoice_settings",
    EMPTY_INV,
  );
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("");
  const save = useServerFn(saveInvoiceSettings);
  const reset = useServerFn(resetInvoiceSeries);
  const previewNext = useServerFn(previewNextInvoiceNumber);

  const refreshPreview = async () => {
    try {
      const p = await previewNext();
      setPreview(p);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refreshPreview();
  }, [row.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setSaving(true);
    try {
      await save({ data: row });
      toast.success("Invoice settings saved");
      refreshPreview();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const doReset = async () => {
    if (
      !confirm(
        "Reset the current invoice series back to 1? Existing invoice numbers are not affected.",
      )
    )
      return;
    try {
      await reset({ data: {} });
      toast.success("Series reset");
      refreshPreview();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading) return <Loader />;

  return (
    <ACard>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Prefix">
          <input
            className="input-lux"
            maxLength={10}
            value={row.prefix}
            onChange={(e) =>
              setRow({ ...row, prefix: e.target.value.toUpperCase() })
            }
          />
        </Field>
        <Field label="Sequence padding (digits)">
          <input
            type="number"
            min={1}
            max={10}
            className="input-lux"
            value={row.seq_padding}
            onChange={(e) =>
              setRow({ ...row, seq_padding: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Format template">
          <input
            className="input-lux"
            value={row.format}
            onChange={(e) => setRow({ ...row, format: e.target.value })}
          />
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Tokens: <code>{"{PREFIX}"}</code>, <code>{"{FY}"}</code>,{" "}
            <code>{"{YEAR}"}</code>, <code>{"{MONTH}"}</code>,{" "}
            <code>{"{SEQ}"}</code> (required).
          </p>
        </Field>
        <label className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            checked={row.reset_yearly}
            onChange={(e) => setRow({ ...row, reset_yearly: e.target.checked })}
          />
          <span className="text-sm font-medium">
            Reset series every financial year (IN: Apr–Mar)
          </span>
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              Next invoice
            </div>
            <div className="mt-1 font-display text-2xl">{preview || "—"}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshPreview}
              className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
            >
              <RefreshCcw size={12} /> Refresh
            </button>
            <button
              onClick={doReset}
              className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Reset series
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="btn-gold rounded-full px-6 py-3 text-sm font-semibold"
        >
          {saving ? "Saving…" : "Save invoice settings"}
        </button>
      </div>
    </ACard>
  );
}

/* -------------------- HELPERS -------------------- */

function Loader() {
  return (
    <div className="flex items-center justify-center py-16 text-[var(--ink-soft)]">
      <Loader2 className="mr-2 animate-spin" size={16} /> Loading…
    </div>
  );
}

function AssetUploader({
  label,
  kind,
  url,
  onChange,
}: {
  label: string;
  kind: "logo" | "signature" | "stamp";
  url: string;
  onChange: (u: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const sign = useServerFn(createCompanyAssetUploadUrl);

  const handle = async (file: File) => {
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const info = await sign({ data: { kind, ext } });
      const put = await fetch(info.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      onChange(info.readUrl);
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
        {label}
      </div>
      <div className="mt-2 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-white">
        {url ? (
          <img
            src={url}
            alt={label}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-[var(--ink-soft)]">
            No {label.toLowerCase()} yet
          </span>
        )}
      </div>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/10">
        <Upload size={12} /> {busy ? "Uploading…" : "Upload PNG/JPG"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handle(f);
          }}
        />
      </label>
    </div>
  );
}
