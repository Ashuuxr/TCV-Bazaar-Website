import { useState } from 'react'
import { Mail, MessageCircle, Phone, Search } from 'lucide-react'
import { ACard } from './ui'
import { inr, useCms } from '@/lib/store'

export default function Customers() {
  const { bookings, packages } = useCms()
  const [q, setQ] = useState('')
  const list = bookings.filter((b) => (b.business.brandName ?? '').toLowerCase().includes(q.toLowerCase()) || (b.business.ownerName ?? '').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Customer Manager</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Every exhibitor who booked — contact them or review their stalls.</p>
      </div>
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
        <input className="input-lux pl-11" placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <ACard><p className="py-10 text-center text-sm text-[var(--ink-soft)]">No customers yet — they'll appear here the moment someone books.</p></ACard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <ACard key={b.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-soft)] font-display text-sm font-semibold text-gold">
                  {(b.business.brandName ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold">{b.business.brandName}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{b.business.ownerName} · {b.business.city}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-[var(--ink-soft)]">
                <div className="flex justify-between"><span>Booking</span><span className="font-medium text-[var(--ink)]">{b.id}</span></div>
                <div className="flex justify-between"><span>Stall</span><span className="font-medium text-[var(--ink)]">{b.stallId} · {packages.find((p) => p.id === b.pkgId)?.name}</span></div>
                <div className="flex justify-between"><span>Paid</span><span className="font-medium text-[var(--ink)]">{inr(b.paid)} / {inr(b.total)}</span></div>
                <div className="flex justify-between"><span>Status</span><span className="font-medium capitalize text-[var(--ink)]">{b.status}</span></div>
              </div>
              <div className="mt-4 flex gap-2">
                <a href={`tel:${b.business.phone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] py-2 text-[11px] font-semibold hover:border-[var(--gold)]"><Phone size={12} /> Call</a>
                <a href={`mailto:${b.business.email}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] py-2 text-[11px] font-semibold hover:border-[var(--gold)]"><Mail size={12} /> Email</a>
                <a href={`https://wa.me/${(b.business.phone ?? '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] py-2 text-[11px] font-semibold hover:border-[var(--gold)]"><MessageCircle size={12} /> WhatsApp</a>
              </div>
            </ACard>
          ))}
        </div>
      )}
    </div>
  )
}
