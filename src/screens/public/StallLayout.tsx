import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@/lib/router-compat";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import StallMap from "@/components/StallMap";
import { inr, useCms } from "@/lib/store";
import type { Stall } from "@/lib/store";
import { X } from "lucide-react";
import { recordAnalyticsEvent } from "@/lib/analytics.functions";

export default function StallLayout() {
  const packages = useCms((s) => s.packages);
  const [pkg, setPkg] = useState<string | null>(null);
  const [sel, setSel] = useState<Stall | null>(null);
  const nav = useNavigate();
  const recordEvent = useServerFn(recordAnalyticsEvent);

  const selectStall = (stall: Stall) => {
    setSel(stall);
    const sessionId =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("tcv-analytics-session")
        : null;
    void recordEvent({
      data: {
        eventName: "layout_click",
        path: "/stall-layout",
        sessionId,
        metadata: { stall_id: stall.id, status: stall.status },
      },
    });
  };

  return (
    <div>
      <PageHero
        eyebrow="Interactive Stall Layout"
        title="Choose your stall, live"
        sub="Click any available stall to reserve it and continue to booking. Real-time availability across all five zones."
      />

      <section className="container-x pb-24">
        <Reveal>
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setPkg(null)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${!pkg ? "border-[var(--gold)] bg-[var(--gold)] text-[#17130c]" : "border-[var(--line)] hover:border-[var(--gold)]"}`}
            >
              All Zones
            </button>
            {packages
              .filter((p) => p.enabled)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPkg(p.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${pkg === p.id ? "border-[var(--gold)] bg-[var(--gold)] text-[#17130c]" : "border-[var(--line)] hover:border-[var(--gold)]"}`}
                >
                  {p.name}
                </button>
              ))}
          </div>
          <StallMap
            selectable
            selected={sel?.id}
            filterPkg={pkg}
            onSelect={selectStall}
          />
        </Reveal>

        {sel && (
          <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg">
            <div className="card-lux flex items-center justify-between gap-4 p-5 shadow-2xl">
              <div>
                <div className="text-sm font-semibold">
                  Stall {sel.label} · {sel.zone}
                </div>
                <div className="text-xs text-[var(--ink-soft)]">
                  {packages.find((p) => p.id === sel.pkgId)?.name} —{" "}
                  {inr(packages.find((p) => p.id === sel.pkgId)?.price ?? 0)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => nav(`/book?pkg=${sel.pkgId}&stall=${sel.id}`)}
                  className="btn-gold rounded-full px-5 py-2.5 text-xs font-semibold"
                >
                  Reserve & Book
                </button>
                <button
                  aria-label="Close stall details"
                  onClick={() => setSel(null)}
                  className="rounded-full border border-[var(--line)] p-2.5"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <Reveal className="mt-12 text-center text-sm text-[var(--ink-soft)]">
          Can't find the perfect spot?{" "}
          <Link to="/contact" className="font-semibold text-gold">
            Contact us
          </Link>{" "}
          — new zones open as the bazaar fills up.
        </Reveal>
      </section>
    </div>
  );
}
