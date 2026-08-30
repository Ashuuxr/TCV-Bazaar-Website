import { Link } from "@/lib/router-compat";
import {
  CalendarDays,
  MapPin,
  Sparkles,
  Users,
  Store,
  HeartHandshake,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { useCms } from "@/lib/store";

export default function About() {
  const { pages, event } = useCms();
  return (
    <div>
      <PageHero
        eyebrow="About Us"
        title={pages.about.heading}
        sub="Connecting businesses, brands and visitors under one glittering roof."
      />

      <section className="container-x grid items-center gap-14 pb-24 lg:grid-cols-2">
        <Reveal>
          <img
            src={pages.about.image}
            alt="Premium Diwali exhibition stalls at TCV Bazaar Keshar Towers Gwalior"
            className="w-full rounded-[1.7rem] object-cover shadow-2xl"
            loading="lazy"
          />
        </Reveal>
        <Reveal delay={0.12}>
          {pages.about.body.split("\n\n").map((p, i) => (
            <p key={i} className="mb-5 leading-relaxed text-[var(--ink-soft)]">
              {p}
            </p>
          ))}
        </Reveal>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--bg-soft)] py-24">
        <div className="container-x">
          <SectionHead
            eyebrow="The Edition"
            title={`${event.name} — ${event.edition}`}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CalendarDays, t: "Dates", d: event.datesLabel },
              { icon: MapPin, t: "Venue", d: `${event.venue}, ${event.city}` },
              {
                icon: Store,
                t: "Stalls",
                d: "50+ curated stalls across 5 zones",
              },
              { icon: Users, t: "Footfall", d: "10,000+ expected visitors" },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 0.07}>
                <div className="card-lux h-full p-7 text-center">
                  <s.icon size={26} className="mx-auto text-gold" />
                  <h3 className="font-display mt-4 text-lg font-medium">
                    {s.t}
                  </h3>
                  <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">Our Promise</span>
            <h2 className="font-display mt-4 text-3xl font-medium leading-tight sm:text-4xl">
              Built by Gwalior, for Gwalior
            </h2>
            <p className="mt-5 leading-relaxed text-[var(--ink-soft)]">
              We are The City Vibes — a Gwalior-born marketing collective that
              believes our city deserves world-class celebration experiences.
              Every edition of TCV Bazaar is crafted with obsessive attention:
              from stall placement and lighting to marketing reels and visitor
              flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/book"
                className="btn-gold rounded-full px-7 py-3 text-sm font-semibold"
              >
                Become an Exhibitor
              </Link>
              <Link
                to="/why-exhibit"
                className="btn-outline-gold rounded-full px-7 py-3 text-sm font-semibold"
              >
                Why Exhibit
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Sparkles,
                  t: "Premium Curation",
                  d: "Every stall is hand-picked for quality.",
                },
                {
                  icon: HeartHandshake,
                  t: "End-to-End Support",
                  d: "From booking to teardown, we are with you.",
                },
                {
                  icon: Users,
                  t: "Community First",
                  d: "A celebration the whole city looks forward to.",
                },
                {
                  icon: Store,
                  t: "Business Results",
                  d: "Sales, leads and visibility that last.",
                },
              ].map((v, i) => (
                <div
                  key={v.t}
                  className={`card-lux p-6 ${i % 2 ? "translate-y-4" : ""}`}
                >
                  <v.icon size={22} className="text-gold" />
                  <h3 className="font-display mt-3 font-medium">{v.t}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">
                    {v.d}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
