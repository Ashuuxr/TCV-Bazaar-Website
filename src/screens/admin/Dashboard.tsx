import { Link } from '@/lib/router-compat'
import { BadgeIndianRupee, CalendarDays, FileText, LayoutGrid, TrendingUp } from 'lucide-react'
import { ACard, Stat } from './ui'
import { inr, useCms } from '@/lib/store'

export default function Dashboard() {
  const { bookings, stalls, packages, activity, event } = useCms()
  const revenue = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'rejected').reduce((a, b) => a + b.paid, 0)
  const pending = bookings.filter((b) => b.status === 'pending').length
  const avail = stalls.filter((s) => s.status === 'available').length
  const occupancy = Math.round(((stalls.length - avail) / stalls.length) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Namaste, Admin</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{event.name} · {event.edition} · {event.datesLabel} — here's the pulse of your bazaar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue Collected" value={inr(revenue)} sub={`${bookings.length} total bookings`} icon={BadgeIndianRupee} />
        <Stat label="Pending Bookings" value={String(pending)} sub="Awaiting verification" icon={FileText} />
        <Stat label="Stalls Available" value={`${avail}/${stalls.length}`} sub={`${occupancy}% occupied`} icon={LayoutGrid} />
        <Stat label="Active Packages" value={String(packages.filter((p) => p.enabled).length)} sub="Visible on website" icon={TrendingUp} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ACard title="Occupancy by zone" sub="Live from the stall layout" >
          <div className="space-y-4">
            {Array.from(new Set(stalls.map((s) => s.zone))).map((z) => {
              const zs = stalls.filter((s) => s.zone === z)
              const occ = Math.round((zs.filter((s) => s.status !== 'available').length / zs.length) * 100)
              return (
                <div key={z}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{z}</span><span className="text-[var(--ink-soft)]">{occ}% occupied</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                    <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${occ}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ACard>

        <ACard title="Recent bookings" sub="Latest first" action={<Link to="/admin/bookings" className="text-xs font-semibold text-gold">View all →</Link>}>
          <div className="space-y-3">
            {bookings.length === 0 && <p className="text-sm text-[var(--ink-soft)]">No bookings yet — share your booking link!</p>}
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold">{b.id}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{b.business.brandName} · Stall {b.stallId}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${b.status === 'approved' ? 'bg-green-500/10 text-green-600' : b.status === 'pending' ? 'bg-blue-500/10 text-blue-500' : 'bg-stone-500/10 text-stone-500'}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </ACard>

        <ACard title="Activity log" sub="Audit trail of every action">
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {activity.length === 0 && <p className="text-sm text-[var(--ink-soft)]">Actions you take will appear here.</p>}
            {activity.slice(0, 12).map((a) => (
              <div key={a.id} className="flex gap-3 text-xs">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <div>
                  <div>{a.text}</div>
                  <div className="text-[10px] text-[var(--ink-soft)]">{new Date(a.at).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </ACard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { to: '/admin/bookings', icon: FileText, t: 'Verify payments', d: `${pending} bookings awaiting approval` },
          { to: '/admin/stalls', icon: LayoutGrid, t: 'Manage stalls', d: 'Create, price & assign stalls' },
          { to: '/admin/events', icon: CalendarDays, t: 'Event settings', d: 'Dates, venue & countdown' },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="card-lux flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><c.icon size={18} /></span>
            <div><div className="text-sm font-semibold">{c.t}</div><div className="text-xs text-[var(--ink-soft)]">{c.d}</div></div>
          </Link>
        ))}
      </div>
    </div>
  )
}
