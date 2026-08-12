import Reveal from './Reveal'

export default function PageHero({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <section className="relative overflow-hidden pb-14 pt-36 sm:pb-20 sm:pt-44">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, var(--gold), transparent 65%)' }} />
      </div>
      <div className="container-x text-center">
        <Reveal>
          <span className="eyebrow justify-center">{eyebrow}</span>
          <h1 className="font-display mx-auto mt-4 max-w-4xl text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">{title}</h1>
          {sub && <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">{sub}</p>}
        </Reveal>
      </div>
    </section>
  )
}
