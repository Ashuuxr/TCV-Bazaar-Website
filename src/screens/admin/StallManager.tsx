import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, X, Loader2, Save } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { ACard, Field } from "./ui";
import { useCms } from "@/lib/store";
import type { Stall, StallStatus } from "@/lib/store";
import { LayoutBackground } from "@/components/StallMap";
import { STATUS_STYLE, stallColors } from "@/lib/stallStyles";
import {
  createStall,
  updateStall,
  deleteStall,
  saveStallLayout,
} from "@/lib/stalls.functions";

const STATUSES: StallStatus[] = [
  "available",
  "reserved",
  "pending",
  "booked",
  "blocked",
  "sold",
];
const SNAP = 0.5;
const CANVAS_W = 140;
const CANVAS_H = 80;

function snap(v: number) {
  return Math.round(v / SNAP) * SNAP;
}

export default function StallManager() {
  const stalls = useCms((s) => s.stalls);
  const packages = useCms((s) => s.packages);
  const patch = useCms((s) => s.patch);
  const log = useCms((s) => s.log);

  const call = {
    create: useServerFn(createStall),
    update: useServerFn(updateStall),
    remove: useServerFn(deleteStall),
    saveLayout: useServerFn(saveStallLayout),
  };

  const [selId, setSelId] = useState<string | null>(null);
  const sel = stalls.find((s) => s.id === selId) ?? null;
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState<{
    id: string;
    dx: number;
    dy: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const localPatch = (id: string, p: Partial<Stall>) =>
    patch(
      "stalls",
      stalls.map((s) => (s.id === id ? { ...s, ...p } : s)),
    );

  const persist = useCallback(
    async (id: string, p: Partial<Stall>) => {
      const dbPatch: Record<string, unknown> = {};
      if ("label" in p) dbPatch.label = p.label;
      if ("zone" in p) dbPatch.zone = p.zone;
      if ("pkgId" in p) dbPatch.pkg_id = p.pkgId;
      if ("status" in p) dbPatch.status = p.status;
      if ("x" in p) dbPatch.x = p.x;
      if ("y" in p) dbPatch.y = p.y;
      if ("w" in p) dbPatch.w = p.w;
      if ("h" in p) dbPatch.h = p.h;
      if ("active" in p) dbPatch.active = p.active;
      if ("priceOverride" in p) dbPatch.price_override = p.priceOverride;
      if ("notes" in p) dbPatch.notes = p.notes;
      if ("color" in p) dbPatch.color = p.color;
      if ("sortOrder" in p) dbPatch.sort_order = p.sortOrder;
      setSaving(true);
      try {
        await call.update({ data: { id, patch: dbPatch } });
        (
          window as unknown as { __tcvRefetchStalls?: () => void }
        ).__tcvRefetchStalls?.();
      } catch (err) {
        alert(`Save failed for ${id}\n\n${(err as Error).message}`);
      } finally {
        setSaving(false);
      }
    },
    [call],
  );

  // Field edits: local first, persist on blur.
  const commit = (p: Partial<Stall>) => {
    if (sel) {
      localPatch(sel.id, p);
      void persist(sel.id, p);
    }
  };
  const editLocal = (p: Partial<Stall>) => {
    if (sel) localPatch(sel.id, p);
  };

  // Drag with pointer events on the SVG surface.
  const svgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const onStallDown = (e: React.PointerEvent, s: Stall) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSelId(s.id);
    const p = svgPoint(e.clientX, e.clientY);
    setDrag({ id: s.id, dx: p.x - s.x, dy: p.y - s.y });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = svgPoint(e.clientX, e.clientY);
    const nx = Math.max(0, Math.min(CANVAS_W - 4, snap(p.x - drag.dx)));
    const ny = Math.max(0, Math.min(CANVAS_H - 3, snap(p.y - drag.dy)));
    localPatch(drag.id, { x: nx, y: ny });
  };
  const onUp = () => {
    if (!drag) return;
    const s = stalls.find((x) => x.id === drag.id);
    setDrag(null);
    if (s) void persist(s.id, { x: s.x, y: s.y });
  };

  useEffect(() => {
    // Keyboard nudges for the selected stall.
    const onKey = (e: KeyboardEvent) => {
      if (!sel || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const step = e.shiftKey ? 2 : SNAP;
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      const nx = Math.max(0, Math.min(CANVAS_W - 4, snap(sel.x + d[0])));
      const ny = Math.max(0, Math.min(CANVAS_H - 3, snap(sel.y + d[1])));
      localPatch(sel.id, { x: nx, y: ny });
      void persist(sel.id, { x: nx, y: ny });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.id, sel?.x, sel?.y]);

  const addStall = async () => {
    const label = prompt("New stall label (e.g. L22, R22, OA9):")?.trim();
    if (!label) return;
    const id = label.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!id) return;
    if (stalls.some((s) => s.id === id)) {
      alert("A stall with that ID already exists.");
      return;
    }
    setSaving(true);
    try {
      await call.create({
        data: {
          id,
          label,
          x: 40,
          y: 60,
          w: 8,
          h: 5,
          status: "available",
          active: true,
          pkg_id: packages[0]?.id ?? null,
          sort_order: stalls.length + 1,
        },
      });
      log(`Created stall ${label}`);
      setSelId(id);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const removeStall = async () => {
    if (!sel) return;
    if (!confirm(`Delete stall ${sel.label}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await call.remove({ data: { id: sel.id } });
      patch(
        "stalls",
        stalls.filter((s) => s.id !== sel.id),
      );
      setSelId(null);
      log(`Deleted stall ${sel.label}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const pkgById = (id: string) => packages.find((p) => p.id === id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-medium sm:text-3xl">
            Stall Layout Manager
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Click a stall to select. Drag to reposition. Arrow keys nudge (Shift
            = larger step). Changes sync live to the public site.
          </p>
        </div>
        <button
          onClick={addStall}
          disabled={saving}
          className="btn-gold flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}{" "}
          Add Stall
        </button>
        <button
          onClick={async () => {
            setSaving(true);
            try {
              const items = stalls.map((s, i) => ({
                id: s.id,
                x: s.x,
                y: s.y,
                w: s.w,
                h: s.h,
                sort_order: s.sortOrder ?? i,
              }));
              const res = await call.saveLayout({ data: { items } });
              (
                window as unknown as { __tcvRefetchStalls?: () => void }
              ).__tcvRefetchStalls?.();
              log(`Saved layout for ${res.updated} stalls`);
            } catch (err) {
              alert(`Save Layout failed\n\n${(err as Error).message}`);
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="btn-outline-gold flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"
        >
          <Save size={14} /> Save Layout
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ACard
            title="Interactive layout"
            sub={
              saving
                ? "Saving…"
                : "Drag any stall to reposition. Selection = golden outline."
            }
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full touch-none select-none rounded-2xl border border-[var(--line)] bg-[#f8fafc]"
              style={{ minHeight: 380 }}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelId(null);
              }}
            >
              <LayoutBackground />
              {stalls.map((s) => {
                const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.available;
                const col = stallColors(s.pkgId, s.color);
                const isSel = selId === s.id;
                const dim = s.active === false ? 0.35 : 1;
                return (
                  <g
                    key={s.id}
                    opacity={dim}
                    onPointerDown={(e) => onStallDown(e, s)}
                    style={{ cursor: "move" }}
                  >
                    <rect
                      x={s.x}
                      y={s.y}
                      width={s.w}
                      height={s.h}
                      rx="0.8"
                      fill={col.fill}
                      stroke={isSel ? "#b98a2f" : col.stroke}
                      strokeWidth={isSel ? 0.9 : 0.35}
                    />
                    {st.overlay && (
                      <rect
                        x={s.x}
                        y={s.y}
                        width={s.w}
                        height={s.h}
                        rx="0.8"
                        fill={st.overlay}
                        pointerEvents="none"
                      />
                    )}
                    <text
                      x={s.x + s.w / 2}
                      y={s.y + s.h / 2 + 0.9}
                      textAnchor="middle"
                      fontSize="2.4"
                      fontWeight="700"
                      fill="#17130c"
                      style={{ pointerEvents: "none" }}
                    >
                      {s.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[var(--ink-soft)]">
              {STATUSES.map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: STATUS_STYLE[k].dot }}
                  />
                  {STATUS_STYLE[k].label}
                </span>
              ))}
              <span className="ml-auto">{stalls.length} stalls</span>
            </div>
          </ACard>
        </div>

        <ACard
          title={sel ? `Stall ${sel.label}` : "Select a stall"}
          sub={sel ? sel.zone || "No zone" : "Click a stall on the layout"}
        >
          {sel ? (
            <div className="space-y-4">
              <Field label="Stall Label">
                <input
                  className="input-lux"
                  value={sel.label}
                  onChange={(e) => editLocal({ label: e.target.value })}
                  onBlur={(e) => persist(sel.id, { label: e.target.value })}
                />
              </Field>
              <Field label="Zone / Row">
                <input
                  className="input-lux"
                  value={sel.zone ?? ""}
                  placeholder="L / R / OA"
                  onChange={(e) => editLocal({ zone: e.target.value })}
                  onBlur={(e) => persist(sel.id, { zone: e.target.value })}
                />
              </Field>
              <Field label="Package">
                <select
                  className="input-lux"
                  value={sel.pkgId ?? ""}
                  onChange={(e) => commit({ pkgId: e.target.value })}
                >
                  <option value="">— None —</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={`Price override (default: ₹${(pkgById(sel.pkgId)?.price ?? 0).toLocaleString("en-IN")})`}
              >
                <input
                  type="number"
                  className="input-lux"
                  value={sel.priceOverride ?? ""}
                  placeholder="Leave empty to use package price"
                  onChange={(e) =>
                    editLocal({
                      priceOverride:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  onBlur={(e) =>
                    persist(sel.id, {
                      priceOverride:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Status">
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        commit({ status: s });
                        log(`Stall ${sel.label} → ${s}`);
                      }}
                      className={`rounded-full border px-3.5 py-2 text-[11px] font-bold capitalize ${sel.status === s ? "border-[var(--gold)] bg-[var(--gold)] text-[#17130c]" : "border-[var(--line)]"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Active on public site">
                <button
                  onClick={() => commit({ active: !(sel.active !== false) })}
                  className={`rounded-full border px-4 py-2 text-[11px] font-semibold ${sel.active !== false ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-[var(--line)] text-[var(--ink-soft)]"}`}
                >
                  {sel.active !== false ? "Visible" : "Hidden"}
                </button>
              </Field>
              <Field label="Custom highlight colour (hex)">
                <input
                  className="input-lux"
                  value={sel.color ?? ""}
                  placeholder="e.g. #b98a2f"
                  onChange={(e) => editLocal({ color: e.target.value })}
                  onBlur={(e) =>
                    persist(sel.id, { color: e.target.value || null })
                  }
                />
              </Field>
              <Field label="Admin notes">
                <textarea
                  className="input-lux min-h-[70px]"
                  value={sel.notes ?? ""}
                  onChange={(e) => editLocal({ notes: e.target.value })}
                  onBlur={(e) =>
                    persist(sel.id, { notes: e.target.value || null })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="X">
                  <input
                    type="number"
                    step={SNAP}
                    className="input-lux"
                    value={sel.x}
                    onChange={(e) => editLocal({ x: Number(e.target.value) })}
                    onBlur={(e) =>
                      persist(sel.id, { x: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Y">
                  <input
                    type="number"
                    step={SNAP}
                    className="input-lux"
                    value={sel.y}
                    onChange={(e) => editLocal({ y: Number(e.target.value) })}
                    onBlur={(e) =>
                      persist(sel.id, { y: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Width">
                  <input
                    type="number"
                    step={SNAP}
                    className="input-lux"
                    value={sel.w}
                    onChange={(e) => editLocal({ w: Number(e.target.value) })}
                    onBlur={(e) =>
                      persist(sel.id, { w: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Height">
                  <input
                    type="number"
                    step={SNAP}
                    className="input-lux"
                    value={sel.h}
                    onChange={(e) => editLocal({ h: Number(e.target.value) })}
                    onBlur={(e) =>
                      persist(sel.id, { h: Number(e.target.value) })
                    }
                  />
                </Field>
              </div>
              <div className="flex items-center gap-2 pt-2">
                {saving && (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--ink-soft)]">
                    <Loader2 size={12} className="animate-spin" /> Saving…
                  </span>
                )}
                {!saving && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                    <Save size={12} /> Synced
                  </span>
                )}
                <button
                  onClick={() => setSelId(null)}
                  className="btn-outline-gold ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                >
                  <X size={13} /> Close
                </button>
                <button
                  onClick={removeStall}
                  className="flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-500"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-[var(--ink-soft)]">
              No stall selected.
            </p>
          )}
        </ACard>
      </div>
    </div>
  );
}
