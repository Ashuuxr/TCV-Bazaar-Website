import { useRef, useState } from 'react'
import { BadgeCheck, Clock, Download, KeyRound, Receipt, Search, Upload, XCircle } from 'lucide-react'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/Reveal'
import { inr, useCms } from '@/lib/store'
import type { Booking } from '@/lib/store'
import { Invoice } from './Booking'
import { generateBookingPdf, type DocKind } from '@/lib/pdfDocs'
import { findBooking, submitBalancePayment } from '@/lib/bookings.functions'
import { useInvoiceContext } from '@/hooks/useInvoiceContext'
import { rowToBooking } from '@/lib/useCloudSync'
import { toast } from 'sonner'

const statusStyle: Record<string, string> = {
  pending: 'bg-blue-500/10 text-blue-500',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-500',
  cancelled: 'bg-stone-500/10 text-stone-500',
}
const payStyle: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  partial: 'bg-blue-500/10 text-blue-500',
  paid: 'bg-green-500/10 text-green-600',
  refunded: 'bg-purple-500/10 text-purple-500',
}

export default function Portal() {
  const { packages, upsertBooking, log, event, site } = useCms()
  const invoiceCtx = useInvoiceContext()
  const [q, setQ] = useState(() => ({
    id: typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('booking') ?? '',
    phone: '',
  }))
  const [found, setFound] = useState<Booking | null | undefined>()
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [paying, setPaying] = useState(false)
  const [utr, setUtr] = useState('')
  const [searching, setSearching] = useState(false)
  const [snapshot, setSnapshot] = useState<{ company: unknown; gst: unknown } | null>(null)
  const [downloading, setDownloading] = useState<DocKind | null>(null)

  const downloadPdf = async (kind: DocKind) => {
    if (!found || downloading) return
    setDownloading(kind)
    try {
      await generateBookingPdf(found, kind, {
        packages,
        event,
        site,
        company: (snapshot?.company as never) ?? invoiceCtx.company,
        gst: (snapshot?.gst as never) ?? invoiceCtx.gst,
      })
      toast.success(`${kind === 'gst' ? 'GST Invoice' : kind === 'receipt' ? 'Receipt' : 'Invoice'} is ready.`)
    } catch (error) {
      console.error('PDF generation failed', error)
      toast.error('Could not generate the PDF. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    try {
      const res = await findBooking({ data: { invoiceNumber: q.id, phone: q.phone } })
      if (!res.ok) {
        setFound(null)
        setErr('No booking found with that Booking ID and phone number.')
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = res.data as any
      const rowData = payload?.row ?? payload
      if (payload?.company || payload?.gst) setSnapshot({ company: payload.company, gst: payload.gst })
      const b = rowToBooking(rowData as never)
      upsertBooking(b)
      setFound(b)
      setErr('')
    } catch {
      setFound(null)
      setErr('Something went wrong. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const uploadBalance = async (proofData: string) => {
    if (!found) return
    try {
      const res = await submitBalancePayment({ data: { invoiceNumber: found.id, phone: found.business.phone, utr, proof: proofData } })
      if (!res.ok) { toast.error('Could not submit balance payment.'); return }
      const updated = rowToBooking(res.data as never)
      upsertBooking(updated)
      log(`Balance payment uploaded for ${found.id}`)
      setFound(updated)
      setPaying(false)
      toast.success('Balance payment submitted for verification.')
    } catch {
      toast.error('Could not submit balance payment.')
    }
  }

  return (
    <div>
      <PageHero eyebrow="Customer Portal" title="Track your booking" sub="Enter your Booking ID and registered phone number to access your stall, invoices and payments." />

      <section className="container-x max-w-4xl pb-24">
        {found === undefined && (
          <Reveal>
            <form onSubmit={search} className="card-lux mx-auto max-w-md p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><KeyRound size={18} /></span>
                <h2 className="font-display text-xl font-medium">Secure sign-in</h2>
              </div>
              <div className="mt-6 space-y-5">
                <div><label className="label-lux">Booking ID</label><input required className="input-lux" placeholder="TCV26-XXXX00" value={q.id} onChange={(e) => setQ({ ...q, id: e.target.value })} /></div>
                <div><label className="label-lux">Registered Phone</label><input required className="input-lux" placeholder="+91" value={q.phone} onChange={(e) => setQ({ ...q, phone: e.target.value })} /></div>
                {err && <p className="text-xs font-medium text-red-500">{err}</p>}
                <button disabled={searching} className="btn-gold flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold disabled:opacity-60">
                  <Search size={15} /> {searching ? 'Searching…' : 'Access My Booking'}
                </button>
              </div>
            </form>
          </Reveal>
        )}

        {found === null && (
          <Reveal className="text-center">
            <div className="card-lux mx-auto max-w-md p-10">
              <XCircle size={40} className="mx-auto text-red-500" />
              <p className="mt-4 text-sm text-[var(--ink-soft)]">No booking found. Check your Booking ID and phone, or <a href="/contact" className="font-semibold text-gold">contact us</a>.</p>
              <button onClick={() => setFound(undefined)} className="btn-outline-gold mt-6 rounded-full px-6 py-2.5 text-sm font-semibold">Try Again</button>
            </div>
          </Reveal>
        )}

        {found && (
          <Reveal>
            <div className="card-lux p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">Booking ID</div>
                  <div className="font-display text-2xl font-semibold text-gold">{found.id}</div>
                  <div className="mt-1 text-sm text-[var(--ink-soft)]">{found.business.brandName} · Stall <strong>{found.stallId}</strong> · {packages.find((p) => p.id === found.pkgId)?.name}</div>
                </div>
                <div className="flex gap-2">
                  <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${statusStyle[found.status]}`}>
                    {found.status === 'pending' ? <Clock size={11} className="mr-1 inline" /> : <BadgeCheck size={11} className="mr-1 inline" />}
                    {found.status}
                  </span>
                  <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${payStyle[found.payStatus]}`}>{found.payStatus}</span>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--line)] p-5 text-center">
                  <div className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">Total</div>
                  <div className="font-display mt-1 text-2xl font-semibold">{inr(found.total)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] p-5 text-center">
                  <div className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">Paid</div>
                  <div className="font-display mt-1 text-2xl font-semibold text-green-600">{inr(found.paid)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] p-5 text-center">
                  <div className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">Balance</div>
                  <div className="font-display mt-1 text-2xl font-semibold text-gold">{inr(found.balance)}</div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <button disabled={Boolean(downloading)} onClick={() => downloadPdf('invoice')} className="btn-outline-gold flex items-center justify-center gap-2 rounded-full py-3 text-xs font-semibold disabled:cursor-wait disabled:opacity-60"><Download size={14} /> {downloading === 'invoice' ? 'Preparing…' : 'Invoice'}</button>
                <button disabled={Boolean(downloading)} onClick={() => downloadPdf('gst')} className="btn-outline-gold flex items-center justify-center gap-2 rounded-full py-3 text-xs font-semibold disabled:cursor-wait disabled:opacity-60"><Download size={14} /> {downloading === 'gst' ? 'Preparing…' : 'GST Invoice'}</button>
                <button disabled={Boolean(downloading)} onClick={() => downloadPdf('receipt')} className="btn-outline-gold flex items-center justify-center gap-2 rounded-full py-3 text-xs font-semibold disabled:cursor-wait disabled:opacity-60"><Receipt size={14} /> {downloading === 'receipt' ? 'Preparing…' : 'Receipt'}</button>
              </div>

              {found.balance > 0 && found.status !== 'cancelled' && found.status !== 'rejected' && (
                <div className="mt-8 rounded-2xl border border-[var(--gold)] bg-[var(--bg-soft)] p-6">
                  {!paying ? (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm"><strong>Balance pending: {inr(found.balance)}</strong><br /><span className="text-xs text-[var(--ink-soft)]">Clear your balance to lock in priority services.</span></div>
                      <button onClick={() => setPaying(true)} className="btn-gold rounded-full px-6 py-3 text-xs font-semibold">Pay Remaining Balance</button>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="label-lux">UTR Number</label><input className="input-lux" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Balance payment UTR" /></div>
                      <div className="flex items-end gap-2">
                        <button onClick={() => fileRef.current?.click()} className="btn-outline-gold flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-xs font-semibold"><Upload size={13} /> Screenshot</button>
                        <button disabled={utr.trim().length < 4} onClick={() => uploadBalance('')} className="btn-gold flex-1 rounded-full py-3 text-xs font-semibold disabled:opacity-40">Submit</button>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; e.target.value = ''
                        if (!f) return
                        if (f.size > 5_000_000) { alert('Please upload an image under 5 MB.'); return }
                        try {
                          const { uploadToBucket } = await import('@/lib/uploads')
                          const res = await uploadToBucket('payment-screenshots', f, { folder: 'balance' })
                          uploadBalance(res.url)
                        } catch (err) { console.error(err); alert('Upload failed.') }
                      }} />
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => { setFound(undefined); setQ({ id: '', phone: '' }) }} className="mt-8 text-xs font-semibold text-[var(--ink-soft)] hover:text-gold">← Sign out of portal</button>
            </div>
            <Invoice booking={found} />
          </Reveal>
        )}
      </section>
    </div>
  )
}
