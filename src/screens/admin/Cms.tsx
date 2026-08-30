import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ACard, Field, SaveBar, useDraft } from "./ui";
import { uid, useCms } from "@/lib/store";

type Tab =
  | "site"
  | "about"
  | "why"
  | "policies"
  | "faqs"
  | "testimonials"
  | "contact";

export default function Cms() {
  const [tab, setTab] = useState<Tab>("site");
  const tabs: [Tab, string][] = [
    ["site", "Site & Brand"],
    ["about", "About Page"],
    ["why", "Why Exhibit"],
    ["policies", "Policies"],
    ["faqs", "FAQs"],
    ["testimonials", "Testimonials"],
    ["contact", "Contact & Social"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">
          Website CMS
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Every word on the public website — editable, no code needed.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${tab === k ? "border-[var(--gold)] bg-[var(--gold)] text-[#17130c]" : "border-[var(--line)] hover:border-[var(--gold)]"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "site" && <SiteTab />}
      {tab === "about" && <AboutTab />}
      {tab === "why" && <WhyTab />}
      {tab === "policies" && <PoliciesTab />}
      {tab === "faqs" && <FaqsTab />}
      {tab === "testimonials" && <TestimonialsTab />}
      {tab === "contact" && <ContactTab />}
    </div>
  );
}

function SiteTab() {
  const { draft, setDraft, save, dirty } = useDraft("site");
  return (
    <ACard
      title="Site identity"
      sub="Name and tagline appear across the site, navbar and footer."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Website Name">
          <input
            className="input-lux"
            value={draft.name}
            onChange={(e) =>
              setDraft({ ...draft, name: e.target.value } as never)
            }
          />
        </Field>
        <Field label="Tagline">
          <input
            className="input-lux"
            value={draft.tagline}
            onChange={(e) =>
              setDraft({ ...draft, tagline: e.target.value } as never)
            }
          />
        </Field>
      </div>
      <p className="mt-4 rounded-xl bg-[var(--bg-soft)] p-4 text-xs text-[var(--ink-soft)]">
        Logo & favicon can be replaced from the <strong>Media Library</strong>{" "}
        (black logo shows in light mode, gold in dark mode — automatically).
      </p>
      <SaveBar dirty={dirty} onSave={save} />
    </ACard>
  );
}

function AboutTab() {
  const { draft, setDraft, save, dirty } = useDraft("pages");
  const media = useCms((s) => s.media);
  const images = [
    "/__l5e/assets-v1/2be1cb38-05ca-40f5-ad24-b5ed4679e0da/gallery-1.png",
    "/__l5e/assets-v1/633a4b3f-6b3f-4852-bfbe-033d4b1f67f9/gallery-2.png",
    "/__l5e/assets-v1/4fe1787a-c65b-4ea0-8a11-0fb4e226dbfc/gallery-3.jpg",
    ...media.filter((m) => m.kind.startsWith("image")).map((m) => m.dataUrl),
  ];
  return (
    <ACard title="About page" sub="Heading, story and feature image.">
      <div className="space-y-5">
        <Field label="Heading">
          <input
            className="input-lux"
            value={draft.about.heading}
            onChange={(e) =>
              setDraft({
                ...draft,
                about: { ...draft.about, heading: e.target.value },
              } as never)
            }
          />
        </Field>
        <Field label="Story (blank line = new paragraph)">
          <textarea
            rows={10}
            className="input-lux"
            value={draft.about.body}
            onChange={(e) =>
              setDraft({
                ...draft,
                about: { ...draft.about, body: e.target.value },
              } as never)
            }
          />
        </Field>
        <Field label="Feature Image (from Media Library)">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {images.map((src) => (
              <button
                key={src}
                onClick={() =>
                  setDraft({
                    ...draft,
                    about: { ...draft.about, image: src },
                  } as never)
                }
                className={`overflow-hidden rounded-xl border-2 ${draft.about.image === src ? "border-[var(--gold)]" : "border-transparent"}`}
              >
                <img
                  src={src}
                  className="aspect-square w-full object-cover"
                  alt=""
                />
              </button>
            ))}
          </div>
        </Field>
      </div>
      <SaveBar dirty={dirty} onSave={save} />
    </ACard>
  );
}

function WhyTab() {
  const { draft, setDraft, save, dirty } = useDraft("pages");
  return (
    <ACard title="Why Exhibit page" sub="Intro heading and subtext.">
      <div className="space-y-5">
        <Field label="Heading">
          <input
            className="input-lux"
            value={draft.why.heading}
            onChange={(e) =>
              setDraft({
                ...draft,
                why: { ...draft.why, heading: e.target.value },
              } as never)
            }
          />
        </Field>
        <Field label="Subtext">
          <textarea
            rows={3}
            className="input-lux"
            value={draft.why.body}
            onChange={(e) =>
              setDraft({
                ...draft,
                why: { ...draft.why, body: e.target.value },
              } as never)
            }
          />
        </Field>
      </div>
      <SaveBar dirty={dirty} onSave={save} />
    </ACard>
  );
}

function PoliciesTab() {
  const { draft, setDraft, save, dirty } = useDraft("pages");
  return (
    <div className="space-y-6">
      {(
        [
          ["privacy", "Privacy Policy"],
          ["refund", "Refund Policy"],
          ["terms", "Terms & Conditions"],
        ] as const
      ).map(([k, l]) => (
        <ACard key={k} title={l}>
          <textarea
            rows={7}
            className="input-lux"
            value={draft[k]}
            onChange={(e) =>
              setDraft({ ...draft, [k]: e.target.value } as never)
            }
          />
        </ACard>
      ))}
      <SaveBar dirty={dirty} onSave={save} />
    </div>
  );
}

function FaqsTab() {
  const { draft, setDraft, save, dirty } = useDraft("faqs");
  const upd = (id: string, k: "q" | "a", v: string) =>
    setDraft(draft.map((f) => (f.id === id ? { ...f, [k]: v } : f)) as never);
  return (
    <ACard
      title="FAQs"
      sub="Shown on the FAQ page and indexed by search engines."
      action={
        <button
          onClick={() =>
            setDraft([
              ...draft,
              { id: uid("f"), q: "New question?", a: "Answer…" },
            ] as never)
          }
          className="btn-gold flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
        >
          <Plus size={13} /> Add FAQ
        </button>
      }
    >
      <div className="space-y-4">
        {draft.map((f, i) => (
          <div
            key={f.id}
            className="rounded-2xl border border-[var(--line)] p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gold">Q{i + 1}</span>
              <input
                className="input-lux"
                value={f.q}
                onChange={(e) => upd(f.id, "q", e.target.value)}
              />
              <button
                onClick={() =>
                  setDraft(draft.filter((x) => x.id !== f.id) as never)
                }
                className="text-[var(--ink-soft)] hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <textarea
              rows={2}
              className="input-lux mt-3"
              value={f.a}
              onChange={(e) => upd(f.id, "a", e.target.value)}
            />
          </div>
        ))}
      </div>
      <SaveBar dirty={dirty} onSave={save} />
    </ACard>
  );
}

function TestimonialsTab() {
  const { draft, setDraft, save, dirty } = useDraft("testimonials");
  const upd = (id: string, k: string, v: string | number) =>
    setDraft(draft.map((t) => (t.id === id ? { ...t, [k]: v } : t)) as never);
  return (
    <ACard
      title="Testimonials"
      sub="Social proof shown on Home & Testimonials pages."
      action={
        <button
          onClick={() =>
            setDraft([
              ...draft,
              {
                id: uid("t"),
                name: "New Name",
                role: "Brand",
                text: "…",
                rating: 5,
              },
            ] as never)
          }
          className="btn-gold flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
        >
          <Plus size={13} /> Add
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {draft.map((t) => (
          <div
            key={t.id}
            className="space-y-3 rounded-2xl border border-[var(--line)] p-4"
          >
            <div className="flex gap-3">
              <input
                className="input-lux"
                value={t.name}
                onChange={(e) => upd(t.id, "name", e.target.value)}
                placeholder="Name"
              />
              <input
                className="input-lux"
                value={t.role}
                onChange={(e) => upd(t.id, "role", e.target.value)}
                placeholder="Role / Brand"
              />
              <button
                onClick={() =>
                  setDraft(draft.filter((x) => x.id !== t.id) as never)
                }
                className="text-[var(--ink-soft)] hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <textarea
              rows={3}
              className="input-lux"
              value={t.text}
              onChange={(e) => upd(t.id, "text", e.target.value)}
            />
            <div className="flex items-center gap-2 text-xs">
              Rating:
              <select
                className="input-lux w-24"
                value={t.rating}
                onChange={(e) => upd(t.id, "rating", Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} ★
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      <SaveBar dirty={dirty} onSave={save} />
    </ACard>
  );
}

function ContactTab() {
  const { draft, setDraft, save, dirty } = useDraft("site");
  return (
    <ACard
      title="Contact details & social"
      sub="Used on the Contact page, footer and WhatsApp confirmations."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone 1">
          <input
            className="input-lux"
            value={draft.contact.phones[0]}
            onChange={(e) =>
              setDraft({
                ...draft,
                contact: {
                  ...draft.contact,
                  phones: [e.target.value, draft.contact.phones[1]],
                },
              } as never)
            }
          />
        </Field>
        <Field label="Phone 2">
          <input
            className="input-lux"
            value={draft.contact.phones[1]}
            onChange={(e) =>
              setDraft({
                ...draft,
                contact: {
                  ...draft.contact,
                  phones: [draft.contact.phones[0], e.target.value],
                },
              } as never)
            }
          />
        </Field>
        <Field label="Email">
          <input
            className="input-lux"
            value={draft.contact.email}
            onChange={(e) =>
              setDraft({
                ...draft,
                contact: { ...draft.contact, email: e.target.value },
              } as never)
            }
          />
        </Field>
        <Field label="Address">
          <input
            className="input-lux"
            value={draft.contact.address}
            onChange={(e) =>
              setDraft({
                ...draft,
                contact: { ...draft.contact, address: e.target.value },
              } as never)
            }
          />
        </Field>
        <Field label="Instagram URL">
          <input
            className="input-lux"
            value={draft.social.instagram}
            onChange={(e) =>
              setDraft({
                ...draft,
                social: { ...draft.social, instagram: e.target.value },
              } as never)
            }
          />
        </Field>
        <Field label="WhatsApp URL">
          <input
            className="input-lux"
            value={draft.social.whatsapp}
            onChange={(e) =>
              setDraft({
                ...draft,
                social: { ...draft.social, whatsapp: e.target.value },
              } as never)
            }
          />
        </Field>
      </div>
      <SaveBar dirty={dirty} onSave={save} />
    </ACard>
  );
}
