import { useEffect, useState } from 'react'

function diff(target: string) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now())
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
  }
}

export default function Countdown({ target, light = true }: { target: string; light?: boolean }) {
  const [t, setT] = useState(() => diff(target))
  useEffect(() => {
    const i = setInterval(() => setT(diff(target)), 1000)
    return () => clearInterval(i)
  }, [target])
  const cells = [
    { v: t.d, l: 'Days' }, { v: t.h, l: 'Hours' }, { v: t.m, l: 'Minutes' }, { v: t.s, l: 'Seconds' },
  ]
  return (
    <div className="flex items-stretch gap-2.5 sm:gap-4">
      {cells.map((c) => (
        <div
          key={c.l}
          className={`min-w-[68px] sm:min-w-[86px] rounded-2xl border px-3 py-3 text-center backdrop-blur-md ${
            light ? 'border-white/20 bg-white/10' : 'border-[var(--line)] bg-[var(--card-bg)]'
          }`}
        >
          <div className={`font-display text-2xl sm:text-4xl font-semibold tabular-nums ${light ? 'text-white' : ''}`}>
            {String(c.v).padStart(2, '0')}
          </div>
          <div className={`mt-1 text-[10px] uppercase tracking-[0.2em] ${light ? 'text-white/60' : 'text-[var(--ink-soft)]'}`}>{c.l}</div>
        </div>
      ))}
    </div>
  )
}
