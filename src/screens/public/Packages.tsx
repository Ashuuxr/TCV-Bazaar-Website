import { Link } from '@/lib/router-compat'
import { BadgeCheck } from 'lucide-react'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/Reveal'
import { inr, useCms } from '@/lib/store'

export default function Packages() {
  const packages = useCms((s) => s.packages).filter((p) => p.enabled)
  return (
    <div>
      <PageHero eyebrow="Stall Packages" title="Packages for every ambition" sub="Transparent pricing, premium inclusions, zero hidden costs. Book online in minutes." />
      <section className="container-x grid gap-5 pb-24 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.08}>
            <div className={`card-lux relative flex h-full flex-col p-8 ${p.popular ? 'ring-2 ring-[var(--gold)]' : ''}`}>
              {p.popular && (
                <div className="-mx-8 -mt-8 mb-6 flex min-h-11 items-center justify-center border-b border-[var(--gold)]/35 bg-[linear-gradient(135deg,rgba(217,180,95,.24),rgba(35,128,120,.2))] px-4">
                  <span className="rounded-full border border-[var(--gold)]/65 bg-[var(--gold)] px-4 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#17130c] shadow-[0_6px_18px_-8px_rgba(217,180,95,.8)]">Most Popular</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-medium">{p.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-[var(--ink-soft)]">{p.size} · {p.tag}</p>
                </div>
              </div>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-semibold text-gold">{inr(p.price)}</span>
                <span className="text-xs text-[var(--ink-soft)]">/ 3 days</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-[var(--ink-soft)]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5"><BadgeCheck size={15} className="mt-0.5 shrink-0 text-gold" /> {f}</li>
                ))}
              </ul>
              <Link to={`/book?pkg=${p.id}`} className="btn-gold mt-8 block rounded-full py-3 text-center text-sm font-semibold">Book {p.name}</Link>
            </div>
          </Reveal>
        ))}
        <Reveal delay={0.2}>
          <div className="card-lux flex h-full flex-col justify-between gap-8 p-8 text-[var(--ink)]">
            <div>
              <h3 className="font-display text-2xl font-medium">Not sure which package fits?</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">Talk to our team — we will recommend the perfect spot based on your products, budget and goals.</p>
            </div>
            <Link to="/contact" className="btn-primary block rounded-full py-3 text-center text-sm font-semibold">Get Free Advice</Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
