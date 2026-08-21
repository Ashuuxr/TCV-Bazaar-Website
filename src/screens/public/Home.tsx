import { Link } from '@/lib/router-compat'
import { motion } from 'framer-motion'
import {
  ArrowRight, CalendarDays, MapPin, Sparkles, Users, TrendingUp, Megaphone,
  Handshake, BadgeCheck, Crown, LayoutGrid, Phone, Star,
} from 'lucide-react'
import Countdown from '@/components/Countdown'
import Reveal from '@/components/Reveal'
import SectionHead from '@/components/SectionHead'
import StallMap from '@/components/StallMap'
import Logo from '@/components/Logo'
import BrochureButton from '@/components/BrochureButton'
import HeroVideo from '@/components/HeroVideo'
import { inr, useCms } from '@/lib/store'

const whyIcons = [Users, Crown, TrendingUp, Handshake, BadgeCheck, Megaphone, Sparkles]
const whyItems = [
  { t: 'High Footfall', d: 'Thousands of festive visitors across three Diwali nights.' },
  { t: 'Premium Audience', d: 'Shoppers who arrive ready to discover and spend.' },
  { t: 'Sales', d: 'A marketplace engineered for real, measurable revenue.' },
  { t: 'Networking', d: 'Meet Gwalior\'s finest brands, creators and buyers.' },
  { t: 'Lead Generation', d: 'Collect genuine leads that convert long after the event.' },
  { t: 'Marketing Support', d: 'Collaboration reels that bring crowds to your stall.' },
  { t: 'Brand Visibility', d: 'Premium branding across the venue and our channels.' },
]

export default function Home() {
  const { hero, event, packages, gallery, testimonials, pages } = useCms()

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative flex min-h-[92svh] items-end overflow-hidden bg-[#0a0812]">
        {hero.videoDataUrl && hero.enabled !== false && hero.visible !== false && (
          <HeroVideo
            src={hero.videoDataUrl}
            poster={hero.poster}
            className="hero-video-motion absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.66)_0%,rgba(0,0,0,.30)_34%,rgba(0,0,0,.42)_66%,rgba(0,0,0,.86)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(217,180,95,.18),transparent_30%),linear-gradient(90deg,rgba(8,6,4,.58),transparent_58%,rgba(8,6,4,.34))]" />
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="glow-orb pointer-events-none absolute -right-24 top-24 h-80 w-80 opacity-70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="container-x relative z-10 flex flex-col items-start justify-between gap-12 pb-20 pt-32 text-left lg:flex-row lg:items-end">
          <div className="max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <Logo className="h-20 sm:h-24 drop-shadow-2xl" gold />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-balance mt-6 max-w-4xl text-5xl font-medium leading-[.98] tracking-[-.04em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.72)] sm:text-7xl md:text-[6.7rem]"
          >
            {hero.heading}{' '}
            <span className="gold-shimmer">{hero.highlight}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}
            className="mt-6 max-w-xl text-sm leading-relaxed text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.8)] sm:text-lg"
          >
            {hero.subheading}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45 }} className="mt-7 flex flex-wrap items-center justify-start gap-x-6 gap-y-2 text-[12px] font-medium uppercase tracking-[0.08em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.82)]">
            <span className="flex items-center gap-2"><CalendarDays size={15} className="text-[#d9b45f]" /> {event.datesLabel}</span>
            <span className="flex items-center gap-2"><MapPin size={15} className="text-[#d9b45f]" /> {event.venue}, {event.city}</span>
            <span className="flex items-center gap-2"><Sparkles size={15} className="text-[#d9b45f]" /> {event.edition}</span>
          </motion.div>

          {hero.showCountdown && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6 }} className="mt-9">
              <Countdown target={event.startISO} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.75 }}
            className="mt-10 flex flex-wrap items-center justify-start gap-3"
          >
            <Link to="/book" className="motion-press rounded-full bg-[#d9b45f] px-7 py-3.5 text-sm font-semibold text-[#17130c] transition hover:-translate-y-0.5 hover:bg-[#e8cc85] hover:shadow-[0_16px_40px_-10px_rgba(217,180,95,.7)]">
              Book Your Stall
            </Link>
            <Link to="/stall-layout" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-[#d9b45f] hover:bg-[#d9b45f] hover:text-[#17130c]">
              View Stall Layout
            </Link>
            <BrochureButton />
            <Link to="/contact" className="flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-[#d9b45f] hover:bg-[#d9b45f] hover:text-[#17130c]">
              <Phone size={15} /> Contact Us
            </Link>
          </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.6 }}
            className="glass-liquid glass-liquid-hover hidden w-full max-w-sm rounded-[1.5rem] p-5 text-white lg:block"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
              <span>Edition 01</span><span className="text-[#d9b45f]">2026</span>
            </div>
            <div className="grid grid-cols-2 gap-5 pt-5">
              <div><div className="font-display text-3xl text-white">50+</div><div className="mt-1 text-xs text-white/55">Premium stalls</div></div>
              <div><div className="font-display text-3xl text-white">3</div><div className="mt-1 text-xs text-white/55">Festive nights</div></div>
              <div><div className="font-display text-3xl text-white">10k+</div><div className="mt-1 text-xs text-white/55">Expected visitors</div></div>
              <div><div className="font-display text-3xl text-white">01</div><div className="mt-1 text-xs text-white/55">Prime venue</div></div>
            </div>
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.2 }} className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/50">
          <div className="h-9 w-[22px] rounded-full border border-white/30 p-1"><div className="mx-auto h-2 w-1 rounded bg-[#d9b45f]" /></div>
        </motion.div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="overflow-hidden border-y border-[var(--line)] bg-[var(--bg-soft)] py-4">
        <div className="animate-marquee flex w-max items-center gap-10 text-sm font-medium tracking-wide text-[var(--ink-soft)]">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex items-center gap-10">
              {['50+ Premium Stalls', '3 Festive Nights', '10,000+ Expected Visitors', 'Live Music & Food Avenue', 'Fully Online Booking', 'Keshar Towers · Gwalior'].map((x) => (
                <span key={x} className="flex items-center gap-3"><Sparkles size={14} className="text-gold" /> {x}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============ ABOUT TEASER ============ */}
      <section className="py-24 sm:py-32">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">About TCV Bazaar</span>
            <h2 className="font-display mt-4 text-3xl font-medium leading-[1.08] tracking-tight sm:text-5xl">{pages.about.heading}</h2>
            <p className="mt-5 leading-relaxed text-[var(--ink-soft)]">{pages.about.body.split('\n')[0]}</p>
            <Link to="/about" className="motion-icon mt-7 inline-flex items-center gap-2 text-sm font-semibold text-gold transition hover:gap-3">
              Our story <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] border border-[var(--gold)] opacity-30" />
              <img src={pages.about.image} alt="Premium Diwali exhibition stalls at Keshar Towers Gwalior" className="w-full rounded-[1.7rem] object-cover shadow-2xl" loading="lazy" />
              <div className="card-lux absolute -bottom-6 -left-4 flex items-center gap-3 px-5 py-4 sm:-left-8">
                <div className="font-display text-3xl font-semibold text-gold">10k+</div>
                <div className="text-xs leading-tight text-[var(--ink-soft)]">Expected<br />Visitors</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ WHY EXHIBIT ============ */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-soft)] py-24 sm:py-32">
        <div className="container-x">
          <SectionHead eyebrow="Why Exhibit" title="Seven reasons brands choose TCV Bazaar" sub={pages.why.body} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {whyItems.map((w, i) => {
              const Icon = whyIcons[i]
              return (
                <Reveal key={w.t} delay={i * 0.06} className={i === 0 ? 'sm:col-span-2 xl:col-span-2' : ''}>
                  <div className="card-lux group h-full p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-gold transition group-hover:bg-[var(--gold)] group-hover:text-[#17130c]">
                      <Icon size={21} />
                    </div>
                    <h3 className="font-display mt-5 text-xl font-medium">{w.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{w.d}</p>
                  </div>
                </Reveal>
              )
            })}
            <Reveal delay={0.42}>
              <Link to="/why-exhibit" className="card-lux flex h-full flex-col items-start justify-between gap-6 p-7" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
                <span className="font-display text-xl font-medium">Explore every advantage for exhibitors</span>
                <span className="flex items-center gap-2 text-sm font-semibold text-gold">Why Exhibit <ArrowRight size={16} /></span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ PACKAGES ============ */}
      <section className="py-24 sm:py-32">
        <div className="container-x">
          <SectionHead eyebrow="Stall Packages" title="Choose your space at the bazaar" sub="Five thoughtfully priced packages — from branding spots to premium hot-spot tents." />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {packages.filter((p) => p.enabled).slice(0, 3).map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <div className={`card-lux relative h-full p-8 ${p.popular ? 'ring-2 ring-[var(--gold)]' : ''}`}>
                  {p.popular && <span className="absolute -top-3 left-8 rounded-full bg-gold px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#17130c]">Most Popular</span>}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-medium">{p.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-wider text-[var(--ink-soft)]">{p.size} · {p.tag}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-semibold text-gold">{inr(p.price)}</div>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-2.5 text-sm text-[var(--ink-soft)]">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5"><BadgeCheck size={15} className="mt-0.5 shrink-0 text-gold" /> {f}</li>
                    ))}
                  </ul>
                  <Link to={`/book?pkg=${p.id}`} className="btn-gold mt-8 block rounded-full py-3 text-center text-sm font-semibold">Book {p.name}</Link>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <Link to="/packages" className="btn-outline-gold inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold">
              View all 5 packages <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ STALL LAYOUT TEASER ============ */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-soft)] py-24 sm:py-32">
        <div className="container-x">
          <SectionHead eyebrow="Interactive Stall Layout" title="Pick your exact spot — live" sub="Our real-time layout shows available, reserved, pending and booked stalls. Reserve yours before someone else does." />
          <Reveal>
            <StallMap compact />
          </Reveal>
          <Reveal className="mt-10 text-center">
            <Link to="/stall-layout" className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold">
              <LayoutGrid size={15} /> Open full interactive layout
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ GALLERY STRIP ============ */}
      <section className="py-24 sm:py-32">
        <div className="container-x">
          <SectionHead eyebrow="Gallery" title="Moments from the bazaar" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {gallery.slice(0, 6).map((g, i) => (
              <Reveal key={g.id} delay={i * 0.05}>
                <div className="group relative overflow-hidden rounded-2xl">
                  <img src={g.src} alt={g.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute bottom-3 left-4 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">{g.title}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-soft)] py-24 sm:py-32">
        <div className="container-x">
          <SectionHead eyebrow="Testimonials" title="Loved by Gwalior's finest brands" />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t, i) => (
              <Reveal key={t.id} delay={i * 0.08}>
                <figure className="card-lux h-full p-7">
                  <div className="flex gap-1 text-gold">{[...Array(t.rating)].map((_, k) => <Star key={k} size={14} fill="currentColor" />)}</div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-[var(--ink-soft)]">“{t.text}”</blockquote>
                  <figcaption className="mt-5 border-t border-[var(--line)] pt-4">
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-[var(--ink-soft)]">{t.role}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="relative overflow-hidden bg-black py-24 sm:py-32">
        <div className="absolute inset-0 bg-black" />
        <div className="container-x relative z-10 text-center">
          <Reveal>
            <span className="eyebrow justify-center">Limited Stalls</span>
            <h2 className="font-display mx-auto mt-4 max-w-3xl text-3xl font-medium leading-tight text-white sm:text-5xl">
              The bazaar lights up in — <span className="gold-shimmer">are you in?</span>
            </h2>
            <div className="mt-9 flex justify-center"><Countdown target={event.startISO} /></div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/book" className="rounded-full bg-[#d9b45f] px-8 py-3.5 text-sm font-semibold text-[#17130c] transition hover:-translate-y-0.5 hover:bg-[#e8cc85]">Book Your Stall Now</Link>
              <Link to="/contact" className="rounded-full border border-white/35 px-8 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-[#d9b45f] hover:bg-[#d9b45f] hover:text-[#17130c]">Talk to Us</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
