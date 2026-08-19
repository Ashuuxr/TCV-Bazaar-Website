import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from '@/lib/router-compat'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, CalendarDays, Check, Copy, CreditCard,
  Download, FileText, Landmark, LayoutGrid, Package as PkgIcon, QrCode, Receipt, Upload, User, MessageCircle, Mail, LockKeyhole,
} from 'lucide-react'
import StallMap from '@/components/StallMap'
import { inr, useCms } from '@/lib/store'
import type { Booking, Stall } from '@/lib/store'
import { generateBookingPdf, type DocKind } from '@/lib/pdfDocs'
import { createBooking, uploadPaymentProof } from '@/lib/bookings.functions'
import { useInvoiceContext } from '@/hooks/useInvoiceContext'
import { track } from '@/lib/useTracker'
import { toast } from 'sonner'

const STEPS = [
  'Select Event', 'Choose Package', 'Stall Layout', 'Business Info',
  'Payment Plan', 'Payment Method', 'Upload Proof', 'Review', 'Confirmation',
]
const stepIcons = [CalendarDays, PkgIcon, LayoutGrid, Building2, CreditCard, Landmark, Upload, FileText, BadgeCheck]

const BIZ_FIELDS: { key: string; label: string; required?: boolean; span?: boolean; type?: string; ph?: string }[] = [
  { key: 'businessName', label: 'Business Name', required: true, ph: 'Your registered business name' },
  { key: 'brandName', label: 'Brand Name', required: true, ph: 'Brand displayed at the stall' },
  { key: 'ownerName', label: 'Owner Name', required: true, ph: 'Full name of owner' },
  { key: 'phone', label: 'Phone Number', required: true, ph: '+91' },
  { key: 'altPhone', label: 'Alternate Phone', ph: '+91 (optional)' },
  { key: 'email', label: 'Email', required: true, type: 'email', ph: 'you@email.com' },
  { key: 'gst', label: 'GST Number (Optional)', ph: '22AAAAA0000A1Z5' },
  { key: 'category', label: 'Product Category', required: true, ph: 'e.g. Jewellery, Food, Fashion' },
  { key: 'address', label: 'Address', required: true, span: true, ph: 'Street address' },
  { key: 'city', label: 'City', required: true, ph: 'Gwalior' },
  { key: 'state', label: 'State', required: true, ph: 'Madhya Pradesh' },
  { key: 'pincode', label: 'Pincode', required: true, ph: '474001' },
  { key: 'website', label: 'Website (Optional)', ph: 'https://' },
  { key: 'instagram', label: 'Instagram (Optional)', ph: '@yourbrand' },
  { key: 'notes', label: 'Special Notes', span: true, ph: 'Anything we should know — power needs, product list…' },
]

export default function BookingPage() {
  const [sp] = useSearchParams()
  const { event, packages, stalls, banks, upsertBooking, patch, log, site, bookingOpen } = useCms()
  const [step, setStep] = useState(0)
  const [pkgId, setPkgId] = useState<string | null>(sp.get('pkg'))
  const invoiceCtx = useInvoiceContext()
  const [stallId, setStallId] = useState<string | null>(sp.get('stall'))
  const [biz, setBiz] = useState<Record<string, string>>({})
  const [payType, setPayType] = useState<'full' | 'advance'>('full')
  const [method, setMethod] = useState('upi')
  const [proof, setProof] = useState({ utr: '', txnId: '', screenshot: '', remarks: '' })
  const [booking, setBooking] = useState<Booking | null>(null)
  const [snapshot, setSnapshot] = useState<{ company: unknown; gst: unknown } | null>(null)
  const [tried, setTried] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pkg = packages.find((p) => p.id === pkgId)
  const bank = banks.find((b) => b.isDefault && b.enabled) ?? banks.find((b) => b.enabled)
  const subtotal = pkg?.price ?? 0
  const hasGst = (biz.gst ?? '').trim().length > 0
  const gstRate = 0.18
  const gstAmount = hasGst ? Math.round(subtotal * gstRate) : 0
  const total = subtotal + gstAmount
  const payNow = payType === 'full' ? total : Math.round(total / 2)
  const balance = total - payNow

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return true
      case 1: return !!pkgId
      case 2: return !!stallId
      case 3: return BIZ_FIELDS.filter((f) => f.required).every((f) => (biz[f.key] ?? '').trim().length > 1)
      case 4: return true
      case 5: return !!method
      case 6: return proof.utr.trim().length > 3
      case 7: return true
      default: return false
    }
  }, [step, pkgId, stallId, biz, method, proof])

  if (!bookingOpen) {
    return (
      <div className="min-h-screen pb-24 pt-28">
        <div className="container-x flex min-h-[60vh] items-center justify-center">
          <div className="card-lux w-full max-w-2xl p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-gold">
              <LockKeyhole size={28} />
            </div>
            <span className="eyebrow mt-6 justify-center">Online Booking</span>
            <h1 className="font-display mt-3 text-3xl font-medium sm:text-5xl">Booking Closed</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
              नई stall bookings अभी स्वीकार नहीं की जा रही हैं। कृपया बाद में दोबारा check करें या हमारी team से संपर्क करें।
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/" className="btn-gold rounded-full px-6 py-3 text-sm font-semibold">Back to Home</Link>
              <Link to="/contact" className="btn-outline-gold rounded-full px-6 py-3 text-sm font-semibold">Contact Team</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const next = () => {
    if (!canNext) { setTried(true); return }
    setTried(false)
    if (step === 1 && pkgId) track('ViewContent', { content_type: 'stall_package', content_ids: [pkgId], value: subtotal, currency: 'INR' })
    if (step === 3) track('Lead', { source: 'booking' })
    if (step === 4) track('InitiateCheckout', { value: total, currency: 'INR', num_items: 1 })
    if (step === 6) track('AddPaymentInfo', { value: payNow, currency: 'INR' })
    if (step === 7) { confirmBooking(); return }
    setStep((s) => Math.min(8, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const confirmBooking = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await createBooking({
        data: {
          pkgId: pkgId!, stallId: stallId!,
          eventName: `${event.name} — ${event.edition}`,
          business: biz, payType, method,
          utr: proof.utr, txnId: proof.txnId,
          proof: proof.screenshot, remarks: proof.remarks,
        },
      })
      if (!res.ok) throw new Error(res.message || 'Booking failed')
      // Trust server-computed amounts.
      const s = res.data
      if (s.company || s.gst) setSnapshot({ company: s.company, gst: s.gst })
      const b: Booking = {
        id: s.invoiceNumber, dbId: s.dbId,
        createdAt: s.createdAt,
        eventName: `${event.name} — ${event.edition}`,
        pkgId: pkgId!, stallId: stallId!, business: biz, payType, method,
        total: s.total, subtotal: s.subtotal, gstRate: s.gstRate, gstAmount: s.gstAmount,
        paid: s.paid, balance: s.balance, utr: proof.utr, txnId: proof.txnId,
        proof: proof.screenshot, remarks: proof.remarks,
        status: 'pending', payStatus: 'pending',
      }
      upsertBooking(b)
      patch('stalls', stalls.map((s) => (s.id === stallId ? { ...s, status: 'pending' as const, customer: biz.brandName || biz.businessName } : s)))
      log(`New booking ${b.id} — ${biz.brandName} · Stall ${stallId}`)
      track('Purchase', { value: s.total, currency: 'INR', content_ids: [pkgId!], transaction_id: s.invoiceNumber })
      track('CompleteRegistration', { value: s.total, currency: 'INR' })
      setBooking(b)
      setStep(8)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Booking failed'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const copy = (t: string) => navigator.clipboard?.writeText(t)

  return (
    <div className="min-h-screen pb-24 pt-28">
      <div className="container-x max-w-5xl">
        {/* header */}
        <div className="text-center">
          <span className="eyebrow justify-center">Online Booking</span>
          <h1 className="font-display mt-3 text-3xl font-medium sm:text-5xl">Book your stall</h1>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">{event.name} · {event.edition} · {event.datesLabel}</p>
        </div>

        {/* stepper */}
        {step < 8 && (
          <div className="mt-10 flex items-center gap-1 overflow-x-auto pb-2 sm:gap-2">
            {STEPS.map((s, i) => {
              const Icon = stepIcons[i]
              const done = i < step, cur = i === step
              return (
                <div key={s} className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => i < step && setStep(i)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
                      cur ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]'
                      : done ? 'border-[var(--gold)] text-gold' : 'border-[var(--line)] text-[var(--ink-soft)]'
                    }`}
                  >
                    {done ? <Check size={13} /> : <Icon size={13} />}
                    <span className="hidden md:inline">{s}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className={`h-px w-3 sm:w-5 ${i < step ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />}
                </div>
              )
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            {/* STEP 1 — event */}
            {step === 0 && (
              <div className="card-lux mx-auto max-w-2xl overflow-hidden">
                <img src="https://drmqujjazvxcubsizmlw.supabase.co/storage/v1/render/image/public/gallery/DSC_4814.JPG?width=1600&quality=75&resize=contain" alt="Diwali celebration" className="h-52 w-full object-cover" />
                <div className="p-8">
                  <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">{event.edition}</span>
                  <h2 className="font-display mt-4 text-3xl font-medium">{event.name}</h2>
                  <div className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
                    <div className="flex items-center gap-2.5"><CalendarDays size={15} className="text-gold" /> {event.datesLabel}</div>
                    <div className="flex items-center gap-2.5"><LayoutGrid size={15} className="text-gold" /> {event.venue}, {event.city}</div>
                  </div>
                  <button onClick={next} className="btn-gold mt-7 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold">
                    Book for this event <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — package */}
            {step === 1 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {packages.filter((p) => p.enabled).map((p) => (
                  <button key={p.id} onClick={() => { setPkgId(p.id); setStallId(null) }}
                    className={`card-lux relative p-7 text-left ${pkgId === p.id ? 'ring-2 ring-[var(--gold)]' : ''}`}>
                    {pkgId === p.id && <span className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[#17130c]"><Check size={15} /></span>}
                    <h3 className="font-display text-xl font-medium">{p.name}</h3>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-[var(--ink-soft)]">{p.size} · {p.tag}</p>
                    <div className="font-display mt-4 text-3xl font-semibold text-gold">{inr(p.price)}</div>
                    <ul className="mt-4 space-y-1.5 text-xs text-[var(--ink-soft)]">
                      {p.features.slice(0, 4).map((f) => <li key={f} className="flex gap-2"><BadgeCheck size={13} className="mt-0.5 shrink-0 text-gold" />{f}</li>)}
                    </ul>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 3 — stall layout */}
            {step === 2 && (
              <div>
                <p className="mb-5 text-center text-sm text-[var(--ink-soft)]">
                  Showing <strong className="text-gold">{pkg?.name}</strong> stalls — tap any <span className="font-semibold">available</span> stall to reserve it.
                </p>
                <StallMap selectable selected={stallId} filterPkg={pkgId} onSelect={(s: Stall) => setStallId(s.id)} />
                {stallId && (
                  <div className="card-lux mx-auto mt-5 flex max-w-md items-center justify-between p-4">
                    <span className="text-sm">Selected: <strong>Stall {stallId}</strong></span>
                    <span className="text-sm font-semibold text-gold">{inr(total)}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 — business info */}
            {step === 3 && (
              <div className="card-lux mx-auto max-w-3xl p-8">
                <h2 className="font-display flex items-center gap-2.5 text-2xl font-medium"><User size={20} className="text-gold" /> Business Information</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {BIZ_FIELDS.map((f) => (
                    <div key={f.key} className={f.span ? 'sm:col-span-2' : ''}>
                      <label className="label-lux">{f.label}{f.required && ' *'}</label>
                      {f.key === 'notes' || f.key === 'address' ? (
                        <textarea rows={f.key === 'notes' ? 3 : 2} className="input-lux" placeholder={f.ph}
                          value={biz[f.key] ?? ''} onChange={(e) => setBiz({ ...biz, [f.key]: e.target.value })} />
                      ) : (
                        <input type={f.type ?? 'text'} className="input-lux" placeholder={f.ph}
                          value={biz[f.key] ?? ''} onChange={(e) => setBiz({ ...biz, [f.key]: e.target.value })} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5 — payment plan */}
            {step === 4 && (
              <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
                {([
                  { k: 'full', t: 'Full Payment', d: `Pay ${inr(total)} now — zero balance, priority services.`, amt: total },
                  { k: 'advance', t: '50% Advance', d: `Pay ${inr(Math.round(total / 2))} now, balance later from your portal.`, amt: Math.round(total / 2) },
                ] as const).map((o) => (
                  <button key={o.k} onClick={() => setPayType(o.k)} className={`card-lux p-8 text-left ${payType === o.k ? 'ring-2 ring-[var(--gold)]' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-medium">{o.t}</h3>
                      {payType === o.k && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[#17130c]"><Check size={15} /></span>}
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{o.d}</p>
                    <div className="font-display mt-5 text-3xl font-semibold text-gold">{inr(o.amt)}</div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">Balance: {inr(total - o.amt)}</div>
                  </button>
                ))}
                <div className="card-lux p-6 text-sm sm:col-span-2">
                  <div className="flex justify-between py-1.5"><span className="text-[var(--ink-soft)]">Subtotal</span><strong>{inr(subtotal)}</strong></div>
                  {hasGst ? (
                    <div className="flex justify-between py-1.5"><span className="text-[var(--ink-soft)]">GST (18%)</span><strong>{inr(gstAmount)}</strong></div>
                  ) : (
                    <div className="flex justify-between py-1.5 text-xs"><span className="text-[var(--ink-soft)]">GST</span><span className="text-[var(--ink-soft)]">Add a GST number in Business Info to include 18% GST</span></div>
                  )}
                  <div className="flex justify-between border-t border-[var(--line)] py-1.5 pt-3"><span className="text-[var(--ink-soft)]">Total payable</span><strong>{inr(total)}</strong></div>
                  <div className="flex justify-between py-1.5"><span className="text-[var(--ink-soft)]">Paying now</span><strong className="text-gold">{inr(payNow)}</strong></div>
                  <div className="flex justify-between py-1.5"><span className="text-[var(--ink-soft)]">Remaining balance</span><strong>{inr(balance)}</strong></div>
                </div>
              </div>
            )}

            {/* STEP 6 — method */}
            {step === 5 && bank && (
              <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex flex-wrap justify-center gap-2">
                  {[['upi', 'UPI', QrCode], ['qr', 'QR Code', QrCode], ['bank', 'Bank Transfer', Landmark], ['manual', 'Manual Transfer', CreditCard]].map(([k, l, Icon]: any) => (
                    <button key={k} onClick={() => setMethod(k)}
                      className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold transition ${method === k ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)] hover:border-[var(--gold)]'}`}>
                      <Icon size={14} /> {l}
                    </button>
                  ))}
                </div>
                <div className="card-lux p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-medium">Pay {inr(payNow)}</h3>
                    <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[11px] font-bold uppercase text-gold">{bank.bankName}</span>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      ['Bank Name', bank.bankName], ['Account Holder', bank.holder],
                      ['Account Number', bank.number], ['IFSC', bank.ifsc],
                      ['Branch', bank.branch], ['UPI ID', bank.upi],
                    ].map(([l, v]) => (
                      <div key={l} className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3">
                        <div><div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{l}</div><div className="text-sm font-semibold">{v}</div></div>
                        <button onClick={() => copy(v)} className="text-[var(--ink-soft)] hover:text-gold"><Copy size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-[var(--bg-soft)] p-6 sm:flex-row">
                    <QrPlaceholder value={bank.upi} size={128} />
                    <div>
                      <div className="text-sm font-semibold">Scan to pay via any UPI app</div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-soft)]">{bank.instructions}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7 — proof */}
            {step === 6 && (
              <div className="card-lux mx-auto max-w-2xl p-8">
                <h2 className="font-display flex items-center gap-2.5 text-2xl font-medium"><Upload size={20} className="text-gold" /> Upload Payment Proof</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div><label className="label-lux">UTR Number *</label><input className="input-lux" value={proof.utr} onChange={(e) => setProof({ ...proof, utr: e.target.value })} placeholder="e.g. 628912345678" /></div>
                  <div><label className="label-lux">Transaction ID</label><input className="input-lux" value={proof.txnId} onChange={(e) => setProof({ ...proof, txnId: e.target.value })} placeholder="Optional" /></div>
                  <div className="sm:col-span-2">
                    <label className="label-lux">Payment Screenshot</label>
                    <button onClick={() => fileRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--line)] p-8 text-sm text-[var(--ink-soft)] transition hover:border-[var(--gold)]">
                      {proof.screenshot ? (
                        <img src={proof.screenshot} alt="proof" className="max-h-40 rounded-xl" />
                      ) : (
                        <><Upload size={22} className="text-gold" /> Tap to upload screenshot (JPG / PNG)</>
                      )}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (!f) return
                        if (f.size > 5_000_000) { alert('Please upload an image under 5 MB.'); return }
                        try {
                          const buf = await f.arrayBuffer()
                          let bin = ''
                          const bytes = new Uint8Array(buf)
                          for (let i = 0; i < bytes.length; i += 0x8000) {
                            bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)))
                          }
                          const dataBase64 = btoa(bin)
                          const res = await uploadPaymentProof({ data: {
                            filename: f.name || 'proof',
                            contentType: f.type || 'image/jpeg',
                            dataBase64,
                          } })
                          if (!res.ok) throw new Error(res.message)
                          setProof({ ...proof, screenshot: res.data.url })
                        } catch (err) { console.error(err); alert('Upload failed.') }
                      }} />
                  </div>
                  <div className="sm:col-span-2"><label className="label-lux">Remarks</label><textarea rows={2} className="input-lux" value={proof.remarks} onChange={(e) => setProof({ ...proof, remarks: e.target.value })} placeholder="Any note for our verification team" /></div>
                </div>
              </div>
            )}

            {/* STEP 8 — review */}
            {step === 7 && (
              <div className="card-lux mx-auto max-w-3xl p-8">
                <h2 className="font-display text-2xl font-medium">Review your booking</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <ReviewBlock title="Event" rows={[[event.name, `${event.edition} · ${event.datesLabel}`], ['Venue', `${event.venue}, ${event.city}`]]} />
                  <ReviewBlock title="Stall" rows={[['Package', pkg?.name ?? ''], ['Stall No.', stallId ?? ''], ['Subtotal', inr(subtotal)], ['GST (18%)', hasGst ? inr(gstAmount) : 'Not applicable'], ['Total', inr(total)]]} />
                  <ReviewBlock title="Business" rows={[['Business', biz.businessName], ['Brand', biz.brandName], ['Owner', biz.ownerName], ['Phone', biz.phone], ['Email', biz.email], ['GST', biz.gst || '—'], ['City', `${biz.city}, ${biz.state} ${biz.pincode}`]]} />
                  <ReviewBlock title="Payment" rows={[['Plan', payType === 'full' ? 'Full Payment' : '50% Advance'], ['Method', method.toUpperCase()], ['Paying now', inr(payNow)], ['Balance', inr(balance)], ['UTR', proof.utr]]} />
                </div>
                <p className="mt-6 rounded-xl bg-[var(--bg-soft)] p-4 text-xs leading-relaxed text-[var(--ink-soft)]">
                  By confirming you agree to our <Link className="text-gold underline" to="/terms">Terms & Conditions</Link> and <Link className="text-gold underline" to="/refund-policy">Refund Policy</Link>. Your stall is held as <strong>Pending</strong> until our team verifies your payment.
                </p>
              </div>
            )}

            {/* STEP 9 — confirmation */}
            {step === 8 && booking && (
              <div className="mx-auto max-w-3xl">
                <div className="card-lux p-8 text-center sm:p-10">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold text-[#17130c]">
                    <BadgeCheck size={38} />
                  </motion.div>
                  <h2 className="font-display mt-6 text-3xl font-medium">Booking received!</h2>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">Your stall is reserved & pending payment verification.</p>
                  <div className="mx-auto mt-6 flex max-w-xs items-center justify-between rounded-2xl border border-[var(--gold)] bg-[var(--bg-soft)] px-5 py-4">
                    <div className="text-left"><div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">Booking ID</div><div className="font-display text-xl font-semibold text-gold">{booking.id}</div></div>
                    <button onClick={() => copy(booking.id)} className="text-[var(--ink-soft)] hover:text-gold"><Copy size={16} /></button>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <button onClick={() => generateBookingPdf(booking, 'invoice', { packages, event, site, company: (snapshot?.company as never) ?? invoiceCtx.company, gst: (snapshot?.gst as never) ?? invoiceCtx.gst })} className="btn-outline-gold flex items-center justify-center gap-2 rounded-full py-3 text-xs font-semibold"><Download size={14} /> Invoice</button>
                    <button onClick={() => generateBookingPdf(booking, 'gst', { packages, event, site, company: (snapshot?.company as never) ?? invoiceCtx.company, gst: (snapshot?.gst as never) ?? invoiceCtx.gst })} className="btn-outline-gold flex items-center justify-center gap-2 rounded-full py-3 text-xs font-semibold"><Download size={14} /> GST Invoice</button>
                    <button onClick={() => generateBookingPdf(booking, 'receipt', { packages, event, site, company: (snapshot?.company as never) ?? invoiceCtx.company, gst: (snapshot?.gst as never) ?? invoiceCtx.gst })} className="btn-outline-gold flex items-center justify-center gap-2 rounded-full py-3 text-xs font-semibold"><Receipt size={14} /> Receipt</button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4 text-left">
                      <Mail size={18} className="shrink-0 text-gold" />
                      <div className="text-xs"><strong>Confirmation email</strong><br /><span className="text-[var(--ink-soft)]">Sent from thecityvibes.marketing@gmail.com</span></div>
                    </div>
                    <a href={`https://wa.me/${site.social.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste! I just booked ${booking.id} (Stall ${booking.stallId}) at TCV Bazaar 2026.`)}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4 text-left transition hover:border-[var(--gold)]">
                      <MessageCircle size={18} className="shrink-0 text-gold" />
                      <div className="text-xs"><strong>WhatsApp confirmation</strong><br /><span className="text-[var(--ink-soft)]">Tap to receive on WhatsApp</span></div>
                    </a>
                  </div>

                  <Link to="/portal" className="btn-gold mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold">
                    Open Customer Portal <ArrowRight size={15} />
                  </Link>
                </div>

                <Invoice booking={booking} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* nav buttons */}
        {step > 0 && step < 8 && (
          <div className="mt-10 flex items-center justify-between">
            <button onClick={() => setStep((s) => s - 1)} className="btn-outline-gold flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
              <ArrowLeft size={15} /> Back
            </button>
            <div>
              {tried && <span className="mr-4 text-xs font-medium text-red-500">Please complete this step to continue.</span>}
              <button onClick={next} disabled={submitting} className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold disabled:opacity-60">
                {step === 7 ? (submitting ? 'Submitting…' : 'Confirm Booking') : 'Continue'} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="mt-10 text-right">
            <button onClick={next} className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold">Continue <ArrowRight size={15} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewBlock({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-gold">{title}</div>
      <div className="mt-3 space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 text-sm">
            <span className="text-[var(--ink-soft)]">{k}</span><span className="text-right font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Deterministic decorative QR placeholder rendered from the UPI string */
export function QrPlaceholder({ value, size = 128 }: { value: string; size?: number }) {
  const cells = 21
  const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  const seed = hash(value || 'tcv')
  const rnd = (i: number) => ((seed * (i + 2654435761)) >>> 0) % 100 < 46
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${cells} ${cells}`} className="rounded-lg bg-white p-0">
      <rect width={cells} height={cells} fill="#fff" />
      {Array.from({ length: cells * cells }).map((_, i) => {
        const x = i % cells, y = Math.floor(i / cells)
        if (finder(x, y)) return null
        return rnd(i) ? <rect key={i} x={x} y={y} width={1} height={1} fill="#17130c" /> : null
      })}
      {[[0, 0], [cells - 7, 0], [0, cells - 7]].map(([fx, fy]) => (
        <g key={`${fx}-${fy}`}>
          <rect x={fx} y={fy} width={7} height={7} fill="#17130c" />
          <rect x={fx + 1} y={fy + 1} width={5} height={5} fill="#fff" />
          <rect x={fx + 2} y={fy + 2} width={3} height={3} fill="#17130c" />
        </g>
      ))}
    </svg>
  )
}

/* ---------------- printable invoice ---------------- */
export function Invoice({ booking: b }: { booking: Booking }) {
  const { packages, event, site } = useCms()
  const pkg = packages.find((p) => p.id === b.pkgId)
  const subtotal = b.subtotal ?? b.total
  const gstAmount = b.gstAmount ?? 0
  const hasGst = gstAmount > 0
  return (
    <div id="invoice-print" className="print-area mt-10 hidden rounded-2xl bg-white p-10 text-[#17130c]">
      <div className="flex items-start justify-between border-b-2 border-[#b98a2f] pb-6">
        <div>
          <img src="/tcv-bazaar-official-logo.png" alt="TCV Bazaar" className="h-14 w-auto object-contain" />
          <div className="mt-2 text-xs text-[#5c554a]">{site.contact.address} · {site.contact.email}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold" id="doc-title">TAX INVOICE</div>
          <div className="mt-1 text-sm">Booking ID: <strong>{b.id}</strong></div>
          <div className="text-xs text-[#5c554a]">{new Date(b.createdAt).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-xs font-bold uppercase text-[#b98a2f]">Billed To</div>
          <div className="mt-1 font-semibold">{b.business.businessName} ({b.business.brandName})</div>
          <div>{b.business.ownerName} · {b.business.phone}</div>
          <div>{b.business.address}, {b.business.city}, {b.business.state} {b.business.pincode}</div>
          {b.business.gst && <div>GSTIN: {b.business.gst}</div>}
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase text-[#b98a2f]">Event</div>
          <div className="mt-1 font-semibold">{b.eventName}</div>
          <div>{event.datesLabel} · {event.venue}, {event.city}</div>
        </div>
      </div>
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-[#e7ddcc] text-left text-xs uppercase text-[#5c554a]">
            <th className="py-2">Description</th><th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#e7ddcc]">
            <td className="py-3">{pkg?.name} — Stall {b.stallId} (3 days)</td>
            <td className="py-3 text-right">{inr(subtotal)}</td>
          </tr>
          {hasGst && (
            <tr className="border-b border-[#e7ddcc]">
              <td className="py-3">GST @ 18% (GSTIN {b.business.gst})</td>
              <td className="py-3 text-right">{inr(gstAmount)}</td>
            </tr>
          )}
          <tr className="border-b border-[#e7ddcc] font-semibold">
            <td className="py-3">Total</td>
            <td className="py-3 text-right">{inr(b.total)}</td>
          </tr>
          <tr><td className="py-3">Payment received ({b.payType === 'full' ? 'Full' : '50% Advance'} · UTR {b.utr})</td><td className="py-3 text-right text-green-700">− {inr(b.paid)}</td></tr>
          <tr className="font-semibold"><td className="py-3">Balance Due</td><td className="py-3 text-right">{inr(b.balance)}</td></tr>
        </tbody>
      </table>
      <div className="mt-10 flex items-end justify-between">
        <div className="text-xs text-[#5c554a]">Thank you for celebrating with TCV Bazaar.<br />{site.contact.phones.join(' · ')}</div>
        <div className="text-center text-xs text-[#5c554a]"><div className="mb-6 h-px w-40 bg-[#17130c]" />Authorised Signatory</div>
      </div>
    </div>
  )
}

// PDF generation now handled by generateBookingPdf in @/lib/pdfDocs
