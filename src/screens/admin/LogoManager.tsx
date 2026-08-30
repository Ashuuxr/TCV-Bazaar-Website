import { useRef } from "react";
import { Trash2, Upload } from "lucide-react";
import type { BrandAssets } from "@/lib/store";
import { ACard, Field, SaveBar, useDraft } from "./ui";
import {
  uploadToBucket,
  deleteFromBucket,
  parseStorageUrl,
} from "@/lib/uploads";
import { useState } from "react";

function LogoSlot({
  label,
  hint,
  value,
  bg = "light",
  onChange,
  onClear,
}: {
  label: string;
  hint: string;
  value: string;
  bg?: "light" | "dark";
  onChange: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const surface = bg === "dark" ? "bg-[#17130c]" : "bg-[#faf7f1]";
  return (
    <div className="rounded-2xl border border-[var(--line)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--ink)]">{label}</div>
          <div className="mt-0.5 text-xs text-[var(--ink-soft)]">{hint}</div>
        </div>
        {value ? (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-semibold text-red-500 hover:border-red-400"
            title="Remove logo"
          >
            <Trash2 size={12} /> Remove
          </button>
        ) : null}
      </div>
      <div
        className={`mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-[var(--line)] ${surface} px-4`}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-[var(--ink-soft)]">
            No image uploaded
          </span>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 2_000_000) {
            alert("Please upload an image under 2 MB.");
            return;
          }
          try {
            setBusy(true);
            // Best-effort delete previous
            const prev = parseStorageUrl(value);
            if (prev?.bucket === "brand-assets")
              await deleteFromBucket("brand-assets", prev.path);
            const res = await uploadToBucket("brand-assets", f, {
              folder: "logos",
            });
            onChange(res.url);
          } catch (err) {
            console.error(err);
            alert("Upload failed. Please try again.");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <button
        onClick={() => !busy && ref.current?.click()}
        disabled={busy}
        className="btn-outline-gold mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold"
      >
        <Upload size={13} />{" "}
        {busy ? "Uploading…" : (value ? "Replace" : "Upload") + " image"}
      </button>
    </div>
  );
}

export default function LogoManager() {
  const { draft, setDraft, save, dirty } = useDraft("brand");
  const set = <K extends keyof BrandAssets>(key: K, value: BrandAssets[K]) =>
    setDraft({ ...draft, [key]: value });
  const clearBrand = async (key: keyof BrandAssets) => {
    const prev = parseStorageUrl(String(draft[key] ?? ""));
    set(key, "" as never);
    if (prev?.bucket === "brand-assets")
      await deleteFromBucket("brand-assets", prev.path);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium">Logo Manager</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Upload your brand marks once — they update instantly across the
          header, footer, admin, login, portal, invoices, receipts and browser
          tab.
        </p>
      </div>

      <ACard
        title="Brand marks"
        sub="PNG or SVG with a transparent background works best. Keep files under 2 MB."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <LogoSlot
            label="Light-mode logo"
            hint="Used on light backgrounds — header, footer, invoices, admin."
            value={draft.logoLight}
            onChange={(v) => set("logoLight", v)}
            onClear={() => clearBrand("logoLight")}
          />
          <LogoSlot
            label="Dark-mode logo"
            hint="Used in dark mode and over the dark hero on the home page."
            value={draft.logoDark}
            bg="dark"
            onChange={(v) => set("logoDark", v)}
            onClear={() => clearBrand("logoDark")}
          />
          <LogoSlot
            label="Mobile logo (optional)"
            hint="Shown on screens ≤ 640 px. Leave empty to reuse the light-mode logo."
            value={draft.logoMobile}
            onChange={(v) => set("logoMobile", v)}
            onClear={() => clearBrand("logoMobile")}
          />
          <LogoSlot
            label="Favicon"
            hint="Browser tab icon. Square PNG or ICO recommended."
            value={draft.favicon}
            onChange={(v) => set("favicon", v)}
            onClear={() => clearBrand("favicon")}
          />
        </div>
      </ACard>

      <ACard
        title="Size & position"
        sub="Controls the header logo. Other surfaces auto-scale."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field label={`Desktop height (${draft.heightDesktop}px)`}>
            <input
              type="range"
              min={24}
              max={96}
              step={1}
              value={draft.heightDesktop}
              onChange={(e) => set("heightDesktop", Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <Field label={`Mobile height (${draft.heightMobile}px)`}>
            <input
              type="range"
              min={20}
              max={72}
              step={1}
              value={draft.heightMobile}
              onChange={(e) => set("heightMobile", Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <Field label="Header position">
            <select
              value={draft.position}
              onChange={(e) =>
                set("position", e.target.value as "left" | "center")
              }
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm"
            >
              <option value="left">Left (default)</option>
              <option value="center">Center</option>
            </select>
          </Field>
        </div>
      </ACard>

      <ACard title="Live preview">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[#faf7f1] p-6">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              Light background
            </div>
            <div
              className={`flex ${draft.position === "center" ? "justify-center" : "justify-start"}`}
            >
              {draft.logoLight ? (
                <img
                  src={draft.logoLight}
                  alt="Light preview"
                  style={{ height: draft.heightDesktop }}
                  className="w-auto object-contain"
                />
              ) : (
                <span className="text-xs text-[var(--ink-soft)]">
                  No light-mode logo
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[#17130c] p-6">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/60">
              Dark background
            </div>
            <div
              className={`flex ${draft.position === "center" ? "justify-center" : "justify-start"}`}
            >
              {draft.logoDark ? (
                <img
                  src={draft.logoDark}
                  alt="Dark preview"
                  style={{ height: draft.heightDesktop }}
                  className="w-auto object-contain"
                />
              ) : (
                <span className="text-xs text-white/50">No dark-mode logo</span>
              )}
            </div>
          </div>
        </div>
      </ACard>

      <SaveBar dirty={dirty} onSave={save} />
    </div>
  );
}
