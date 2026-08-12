import { useState } from 'react'
import { Link } from '@/lib/router-compat'
import { ChevronDown } from 'lucide-react'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/Reveal'
import { useCms } from '@/lib/store'

export default function Faq() {
  const faqs = useCms((s) => s.faqs)
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null)
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />
      <PageHero eyebrow="FAQ" title="Questions, answered" sub="Everything exhibitors and visitors ask us most." />
      <section className="container-x max-w-3xl pb-24">
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.04}>
              <div className="card-lux overflow-hidden">
                <button
                  onClick={() => setOpen(open === f.id ? null : f.id)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-lg font-medium">{f.q}</span>
                  <ChevronDown size={18} className={`shrink-0 text-gold transition-transform duration-300 ${open === f.id ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${open === f.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-[var(--ink-soft)]">{f.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center text-sm text-[var(--ink-soft)]">
          Still curious? <Link to="/contact" className="font-semibold text-gold">Reach out</Link> — we reply within hours.
        </Reveal>
      </section>
    </div>
  )
}
