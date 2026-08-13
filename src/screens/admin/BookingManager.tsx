import { useMemo, useState } from 'react'
import { BadgeCheck, Ban, Download, Eye, Search, Trash2, X, XCircle } from 'lucide-react'
import { ACard } from './ui'
import { inr, useCms } from '@/lib/store'
import type { Booking } from '@/lib/store'
import { deleteBooking, updateBookingStatus } from '@/lib/bookings.functions'
import { rowToBooking } from '@/lib/useCloudSync'
import { generateBookingPdf, type DocKind } from '@/lib/pdfDocs'
import { useInvoiceContext } from '@/hooks/useInvoiceContext'
import { toast } from 'sonner'
import { BookingDeleteDialog } from './BookingDeleteDialog'

export default function BookingManager() {
  const { bookings, packages, stalls, patch, upsertBooking, log, event, site } = useCms()
  const { company, gst } = useInvoiceContext()
  const [q, setQ] = useState('')
  const [view, setView] = useState<Booking | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null)
  const [deleting, setDeleting] = useState(false)

  const download = (b: Booking, kind: DocKind) =>
    generateBookingPdf(b, kind, { packages, event, site, company, gst })

  const list = useMemo(() => {
    const t = q.toLowerCase()
    return bookings.filter((b) =>
      [b.id, b.business.brandName, b.business.businessName, b.business.ownerName, b.business.phone, b.business.gst]
        .some((v) => (v ?? '').toLowerCase().includes(t)),
    )
  }, [bookings, q])

  const setStatus = async (b: Booking, status: Booking['status']) => {
    if (!b.dbId) { toast.error('This booking is not synced to the cloud yet.'); return }
    try {
      const row = await updateBookingStatus({ data: { dbId: b.dbId, status } })
      const updated = rowToBooking(row as never)
      upsertBooking(updated)
      if (status === 'approved') {
        patch('stalls', stalls.map((s) => (s.id === b.stallId ? { ...s, status: 'booked' as const, customer: b.business.brandName } : s)))
      } else if (status === 'rejected' || status === 'cancelled') {
        patch('stalls', stalls.map((s) => (s.id === b.stallId ? { ...s, status: 'available' as const, customer: undefined } : s)))
      }
      log(`Booking ${b.id} → ${status}`)
      toast.success(`Booking ${status}.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
  }

  const removeBooking = async () => {
    if (!deleteTarget?.dbId) { toast.error('This booking is not synced to the cloud yet.'); return }
    setDeleting(true)
    try {
      await deleteBooking({ data: { dbId: deleteTarget.dbId } })
      patch('bookings', bookings.filter((b) => b.dbId !== deleteTarget.dbId))
      if (deleteTarget.stallId) patch('stalls', stalls.map((s) => s.id === deleteTarget.stallId ? { ...s, status: 'available' as const, customer: undefined } : s))
      if (view?.dbId === deleteTarget.dbId) setView(null)
      setDeleteTarget(null)
      toast.success(`Booking ${deleteTarget.id} deleted.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally { setDeleting(false) }
  }

  const exportCsv = () => {
    const rows = [['Booking ID', 'Date', 'Brand', 'Owner', 'Phone', 'Email', 'GST', 'Stall', 'Package', 'Total', 'Paid', 'Balance', 'Status'],
      ...list.map((b) => [b.id, new Date(b.createdAt).toLocaleDateString('en-IN'), b.business.brandName ?? '', b.business.ownerName ?? '', b.business.phone ?? '', b.business.email ?? '', b.business.gst ?? '', b.stallId, packages.find((p) => p.id === b.pkgId)?.name ?? '', String(b.total), String(b.paid), String(b.balance), b.status])]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv])); a.download = 'tcv-bookings.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Booking Manager</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Approve, reject, cancel, assign stalls and generate invoices.</p>
        </div>
        <button onClick={exportCsv} className="btn-outline-gold flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"><Download size={14} /> Export Excel</button>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
        <input className="input-lux pl-11" placeholder="Search by customer, phone, brand, booking ID or GST…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <ACard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                <th className="py-3 pr-4">Booking</th><th className="py-3 pr-4">Customer</th><th className="py-3 pr-4">Stall</th>
                <th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Status</th><th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-[var(--ink-soft)]">No bookings found.</td></tr>}
              {list.map((b) => (
                <tr key={b.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-3.5 pr-4"><div className="font-semibold">{b.id}</div><div className="text-xs text-[var(--ink-soft)]">{new Date(b.createdAt).toLocaleDateString('en-IN')}</div></td>
                  <td className="py-3.5 pr-4"><div>{b.business.brandName}</div><div className="text-xs text-[var(--ink-soft)]">{b.business.phone}</div></td>
                  <td className="py-3.5 pr-4">{b.stallId} · <span className="text-xs text-[var(--ink-soft)]">{packages.find((p) => p.id === b.pkgId)?.name}</span></td>
                  <td className="py-3.5 pr-4"><div>{inr(b.paid)} <span className="text-xs text-[var(--ink-soft)]">/ {inr(b.total)}</span></div></td>
                  <td className="py-3.5 pr-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${b.status === 'approved' ? 'bg-green-500/10 text-green-600' : b.status === 'pending' ? 'bg-blue-500/10 text-blue-500' : b.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-stone-500/10 text-stone-500'}`}>{b.status}</span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button title="View" onClick={() => setView(b)} className="rounded-lg border border-[var(--line)] p-2 hover:border-[var(--gold)]"><Eye size={13} /></button>
                      {b.status !== 'approved' && <button title="Approve" onClick={() => setStatus(b, 'approved')} className="rounded-lg border border-[var(--line)] p-2 text-green-600 hover:border-green-400"><BadgeCheck size={13} /></button>}
                      {b.status !== 'rejected' && <button title="Reject" onClick={() => setStatus(b, 'rejected')} className="rounded-lg border border-[var(--line)] p-2 text-red-500 hover:border-red-400"><XCircle size={13} /></button>}
                      {b.status !== 'cancelled' && <button title="Cancel" onClick={() => setStatus(b, 'cancelled')} className="rounded-lg border border-[var(--line)] p-2 text-stone-500 hover:border-stone-400"><Ban size={13} /></button>}
                      <button title="Delete" onClick={() => setDeleteTarget(b)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:border-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ACard>

      {deleteTarget && <BookingDeleteDialog bookingId={deleteTarget.id} customerName={deleteTarget.business.brandName || deleteTarget.business.ownerName} busy={deleting} onClose={() => { if (!deleting) setDeleteTarget(null) }} onConfirm={removeBooking} />}

      {view && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur" onClick={() => setView(null)}>
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-[var(--bg)] p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-medium">{view.id}</h2>
                <p className="text-xs text-[var(--ink-soft)]">{new Date(view.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setView(null)} className="rounded-full border border-[var(--line)] p-2.5"><X size={16} /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info title="Business" rows={[['Business', view.business.businessName], ['Brand', view.business.brandName], ['Owner', view.business.ownerName], ['Phone', view.business.phone], ['Alt Phone', view.business.altPhone || '—'], ['Email', view.business.email], ['GST', view.business.gst || '—'], ['Category', view.business.category], ['City', `${view.business.city}, ${view.business.state} ${view.business.pincode}`]]} />
              <Info title="Payment" rows={[['Package', packages.find((p) => p.id === view.pkgId)?.name ?? ''], ['Stall', view.stallId], ['Plan', view.payType === 'full' ? 'Full' : '50% Advance'], ['Method', view.method.toUpperCase()], ['Subtotal', inr(view.subtotal ?? view.total)], ['GST (18%)', (view.gstAmount ?? 0) > 0 ? inr(view.gstAmount!) : 'N/A'], ['Total', inr(view.total)], ['Paid', inr(view.paid)], ['Balance', inr(view.balance)], ['UTR', view.utr], ['Txn ID', view.txnId || '—']]} />
            </div>
            {view.proof && (
              <div className="mt-4"><div className="label-lux">Payment Screenshot</div><img src={view.proof} className="max-h-56 rounded-xl border border-[var(--line)]" alt="proof" /></div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => download(view, 'invoice')} className="btn-outline-gold rounded-full px-5 py-2.5 text-xs font-semibold">Print Invoice</button>
              <button onClick={() => download(view, 'gst')} className="btn-outline-gold rounded-full px-5 py-2.5 text-xs font-semibold">Print GST Invoice</button>
              <button onClick={() => download(view, 'receipt')} className="btn-outline-gold rounded-full px-5 py-2.5 text-xs font-semibold">Print Receipt</button>
              <button onClick={() => setStatus(view, 'approved')} className="btn-gold rounded-full px-5 py-2.5 text-xs font-semibold">Approve & Confirm</button>
              <button onClick={() => setDeleteTarget(view)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-xs font-semibold text-red-600"><Trash2 size={13} /> Delete booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-gold">{title}</div>
      <div className="mt-2.5 space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 text-xs"><span className="text-[var(--ink-soft)]">{k}</span><span className="text-right font-medium">{v}</span></div>
        ))}
      </div>
    </div>
  )
}
