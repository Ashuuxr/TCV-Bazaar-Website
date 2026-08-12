import { Quote, Star } from 'lucide-react'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/Reveal'
import { useCms } from '@/lib/store'

export default function Testimonials() {
  const testimonials = useCms((s) => s.testimonials)
  return (
    <div>
      <PageHero eyebrow="Testimonials" title="Exhibitors who became family" sub="Real stories from brands that lit up their Diwali with TCV Bazaar." />
      <section className="container-x grid gap-5 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.id} delay={(i % 3) * 0.07}>
            <figure className="card-lux relative h-full p-7">
              <Quote size={34} className="absolute right-6 top-6 text-[var(--gold)] opacity-20" />
              <div className="flex gap-1 text-gold">{[...Array(t.rating)].map((_, k) => <Star key={k} size={14} fill="currentColor" />)}</div>
              <blockquote className="mt-4 text-sm leading-relaxed text-[var(--ink-soft)]">“{t.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--line)] pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-soft)] font-display text-sm font-semibold text-gold">
                  {t.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </section>
    </div>
  )
}
