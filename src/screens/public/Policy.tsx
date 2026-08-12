import PageHero from '@/components/PageHero'
import Reveal from '@/components/Reveal'
import { useCms } from '@/lib/store'

export default function Policy({ kind }: { kind: 'privacy' | 'refund' | 'terms' }) {
  const pages = useCms((s) => s.pages)
  const meta = {
    privacy: { eyebrow: 'Legal', title: 'Privacy Policy', body: pages.privacy },
    refund: { eyebrow: 'Legal', title: 'Refund Policy', body: pages.refund },
    terms: { eyebrow: 'Legal', title: 'Terms & Conditions', body: pages.terms },
  }[kind]
  return (
    <div>
      <PageHero eyebrow={meta.eyebrow} title={meta.title} sub="Last updated: January 2026" />
      <section className="container-x max-w-3xl pb-24">
        <Reveal>
          <div className="card-lux p-8 sm:p-10">
            {meta.body.split('\n\n').map((p, i) => (
              <p key={i} className="mb-5 leading-relaxed text-[var(--ink-soft)] last:mb-0">{p}</p>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  )
}
