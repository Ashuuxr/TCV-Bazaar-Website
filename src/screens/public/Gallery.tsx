import { useState } from "react";
import { X } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useCms } from "@/lib/store";

export default function Gallery() {
  const gallery = useCms((s) => s.gallery);
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const cats = ["All", ...Array.from(new Set(gallery.map((g) => g.category)))];
  const list =
    cat === "All" ? gallery : gallery.filter((g) => g.category === cat);
  const current = gallery.find((g) => g.id === open);

  return (
    <div>
      <PageHero
        eyebrow="Gallery"
        title="The bazaar in frames"
        sub="Glimpses of the lights, the stalls and the celebrations."
      />
      <section className="container-x pb-24">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${cat === c ? "border-[var(--gold)] bg-[var(--gold)] text-[#17130c]" : "border-[var(--line)] hover:border-[var(--gold)]"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
          {list.map((g, i) => (
            <Reveal key={g.id} delay={(i % 3) * 0.05}>
              <button
                onClick={() => setOpen(g.id)}
                className="group relative block w-full overflow-hidden rounded-2xl"
              >
                <img
                  src={g.src}
                  alt={g.title}
                  loading="lazy"
                  className="w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute bottom-3 left-4 text-left">
                  <div className="text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
                    {g.title}
                  </div>
                  <div className="text-xs text-white/70 opacity-0 transition group-hover:opacity-100">
                    {g.category}
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur"
          onClick={() => setOpen(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(null);
          }}
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setOpen(null)}
            className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full border border-white/30 text-white"
          >
            <X />
          </button>
          <img
            src={current.src}
            alt={current.title}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />
          <div className="absolute bottom-6 text-sm font-medium text-white">
            {current.title}
          </div>
        </div>
      )}
    </div>
  );
}
