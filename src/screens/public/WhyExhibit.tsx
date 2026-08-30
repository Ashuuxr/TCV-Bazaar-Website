import { Link } from "@/lib/router-compat";
import {
  Users,
  Crown,
  TrendingUp,
  Handshake,
  BadgeCheck,
  Megaphone,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { useCms } from "@/lib/store";

const items = [
  {
    icon: Users,
    t: "High Footfall",
    d: "Three Diwali nights at Keshar Towers draw thousands of families, shoppers and celebration-seekers. Your brand meets them all — at peak festive buying mood.",
  },
  {
    icon: Crown,
    t: "Premium Audience",
    d: "Our curation, venue and marketing attract Gwalior's discerning, spending-ready crowd — not window shoppers, buyers.",
  },
  {
    icon: TrendingUp,
    t: "Sales",
    d: "Diwali is India's biggest shopping season. Exhibitors routinely recover their stall investment within the first evening.",
  },
  {
    icon: Handshake,
    t: "Networking",
    d: "Meet fellow founders, distributors, creators and collaborators. The bazaar is Gwalior's festive business salon.",
  },
  {
    icon: BadgeCheck,
    t: "Lead Generation",
    d: "Every enquiry at your stall is a warm lead. Collect contacts, build your festive customer base, retarget after the event.",
  },
  {
    icon: Megaphone,
    t: "Marketing Support",
    d: "Collaboration reels shot at your stall and published on our high-reach channels drive visitors straight to you.",
  },
  {
    icon: Sparkles,
    t: "Brand Visibility",
    d: "Banners, venue branding, social features and press coverage put your brand in the city's festive spotlight.",
  },
];

export default function WhyExhibit() {
  const pages = useCms((s) => s.pages);
  return (
    <div>
      <PageHero
        eyebrow="Why Exhibit"
        title={pages.why.heading}
        sub={pages.why.body}
      />
      <section className="container-x grid gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((w, i) => (
          <Reveal
            key={w.t}
            delay={(i % 3) * 0.08}
            className={i === 0 ? "lg:row-span-2" : ""}
          >
            <div className="card-lux group flex h-full flex-col p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-gold transition group-hover:bg-[var(--gold)] group-hover:text-[#17130c]">
                <w.icon size={24} />
              </div>
              <h3 className="font-display mt-6 text-2xl font-medium">{w.t}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink-soft)]">
                {w.d}
              </p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--bg-soft)] py-20">
        <div className="container-x">
          <SectionHead
            eyebrow="Next Step"
            title="Ready to light up your brand?"
            sub="Stalls are allotted on a first-come, first-served basis from the live layout."
          />
          <Reveal className="text-center">
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/book"
                className="btn-gold inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold"
              >
                Book Your Stall <ArrowRight size={15} />
              </Link>
              <Link
                to="/packages"
                className="btn-outline-gold rounded-full px-8 py-3.5 text-sm font-semibold"
              >
                Compare Packages
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
