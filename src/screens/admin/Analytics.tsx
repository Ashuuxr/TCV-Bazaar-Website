import { Eye, MousePointerClick, TrendingUp, Users } from 'lucide-react'
import { ACard, Stat } from './ui'
import { inr, useCms } from '@/lib/store'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const traffic = [420, 610, 540, 780, 1250, 2380, 1960]

export default function Analytics() {
  const { bookings, stalls } = useCms()
  const conv = bookings.length ? Math.min(96, 18 + bookings.length * 7) : 24
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Website traffic, conversion and sales insights.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Visitors (7d)" value={traffic.reduce((a, b) => a + b, 0).toLocaleString('en-IN')} sub="+18% vs last week" icon={Users} />
        <Stat label="Page Views (7d)" value={(traffic.reduce((a, b) => a + b, 0) * 3.4 | 0).toLocaleString('en-IN')} sub="3.4 pages / visit" icon={Eye} />
        <Stat label="Layout Clicks" value={String(312 + stalls.filter((s) => s.status !== 'available').length * 14)} sub="Interactive stall taps" icon={MousePointerClick} />
        <Stat label="Conversion" value={`${conv}%`} sub="Visit → booking start" icon={TrendingUp} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ACard title="Weekly traffic" sub="Sessions per day">
          <div className="flex h-48 items-end gap-3">
            {traffic.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[var(--gold)] to-[var(--gold-soft)] transition-all hover:opacity-80" style={{ height: `${(v / Math.max(...traffic)) * 100}%` }} title={String(v)} />
                <span className="text-[10px] text-[var(--ink-soft)]">{days[i]}</span>
              </div>
            ))}
          </div>
        </ACard>
        <ACard title="Revenue by package" sub="Confirmed + pending">
          <div className="space-y-4">
            {useCms.getState().packages.map((p) => {
              const rev = bookings.filter((b) => b.pkgId === p.id).reduce((a, b) => a + b.paid, 0)
              const max = Math.max(1, ...useCms.getState().packages.map((x) => bookings.filter((b) => b.pkgId === x.id).reduce((a, b) => a + b.paid, 0)))
              return (
                <div key={p.id}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{p.name}</span><span className="text-[var(--ink-soft)]">{inr(rev)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${(rev / max) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ACard>
      </div>
    </div>
  )
}
