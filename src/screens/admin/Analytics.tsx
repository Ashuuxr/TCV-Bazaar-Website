import { useEffect, useState } from 'react'
import { AlertTriangle, Eye, Loader2, MousePointerClick, RotateCcw, TrendingUp, Users, X } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { ACard, Stat } from './ui'
import { inr, useCms } from '@/lib/store'
import { getAnalyticsSummary, resetAnalyticsData, type AnalyticsSummary } from '@/lib/analytics.functions'

const EMPTY_SUMMARY: AnalyticsSummary = {
  visitors7d: 0,
  pageViews7d: 0,
  layoutClicks7d: 0,
  daily: [],
}

function TripleAnalyticsResetDialog({ busy, onClose, onConfirm }: { busy: boolean; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [typed, setTyped] = useState('')
  const firstPhrase = 'RESET ANALYTICS'
  const finalPhrase = 'RESET TCV ANALYTICS DATA'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="reset-analytics-title">
      <div className="w-full max-w-md rounded-3xl border border-red-200 bg-[var(--card-bg)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600"><AlertTriangle size={20} /></div>
            <div>
              <h2 id="reset-analytics-title" className="font-display text-xl font-medium">Reset analytics data?</h2>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Three confirmations are required.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={busy} className="rounded-full p-2 text-[var(--ink-soft)] hover:bg-[var(--bg-soft)] disabled:opacity-50" aria-label="Close"><X size={17} /></button>
        </div>

        {step === 1 ? (
          <>
            <p className="mt-5 text-sm leading-relaxed">First confirmation: this will permanently delete only analytics events such as page views and layout clicks. Bookings, payments, customers, invoices and audit history will remain unchanged.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} disabled={busy} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Cancel</button>
              <button onClick={() => { setTyped(''); setStep(2) }} disabled={busy} className="rounded-full bg-red-600 px-4 py-2.5 text-xs font-semibold text-white">I understand — continue</button>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <p className="mt-5 text-sm leading-relaxed">Second confirmation: type <strong>{firstPhrase}</strong> exactly to confirm that the analytics event history should be deleted.</p>
            <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={firstPhrase} className="input-lux mt-4" autoComplete="off" spellCheck={false} />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setTyped(''); setStep(1) }} disabled={busy} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Back</button>
              <button onClick={() => { setTyped(''); setStep(3) }} disabled={busy || typed.trim() !== firstPhrase} className="rounded-full bg-red-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">Confirm second time</button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm leading-relaxed">Final confirmation: type <strong>{finalPhrase}</strong> exactly. This action cannot be undone.</p>
            <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={finalPhrase} className="input-lux mt-4" autoComplete="off" spellCheck={false} />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setTyped(''); setStep(2) }} disabled={busy} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Back</button>
              <button onClick={() => void onConfirm()} disabled={busy || typed.trim() !== finalPhrase} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                {busy ? 'Resetting…' : 'Reset permanently'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { bookings, stalls, packages } = useCms()
  const [summary, setSummary] = useState<AnalyticsSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const loadSummary = useServerFn(getAnalyticsSummary)
  const reset = useServerFn(resetAnalyticsData)

  const load = async () => {
    setLoading(true)
    try {
      setSummary(await loadSummary({ data: undefined }))
    } catch (error) {
      alert(`Analytics load failed\n\n${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const conv = summary.visitors7d ? Math.min(96, Math.round((bookings.length / summary.visitors7d) * 100)) : 0
  const traffic = summary.daily.length ? summary.daily : Array.from({ length: 7 }, (_, i) => ({ day: String(i), label: '—', pageViews: 0 }))
  const maxTraffic = Math.max(1, ...traffic.map((item) => item.pageViews))

  const handleReset = async () => {
    setResetting(true)
    try {
      const result = await reset({ data: undefined })
      setResetOpen(false)
      await load()
      alert(`Analytics reset complete. ${result.deleted} event${result.deleted === 1 ? '' : 's'} deleted.`)
    } catch (error) {
      alert(`Analytics reset failed\n\n${(error as Error).message}`)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Real website traffic, conversion and sales insights from Supabase analytics events.</p>
        </div>
        <button onClick={() => setResetOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-300 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
          <RotateCcw size={14} /> Reset Analytics Data
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Visitors (7d)" value={loading ? '…' : summary.visitors7d.toLocaleString('en-IN')} sub="Unique tracked sessions" icon={Users} />
        <Stat label="Page Views (7d)" value={loading ? '…' : summary.pageViews7d.toLocaleString('en-IN')} sub="Real public page views" icon={Eye} />
        <Stat label="Layout Clicks" value={loading ? '…' : summary.layoutClicks7d.toLocaleString('en-IN')} sub="Interactive stall taps" icon={MousePointerClick} />
        <Stat label="Conversion" value={loading ? '…' : `${conv}%`} sub="Tracked visitors → bookings" icon={TrendingUp} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ACard title="Weekly traffic" sub="Real page views per day">
          <div className="flex h-48 items-end gap-3">
            {traffic.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[var(--gold)] to-[var(--gold-soft)] transition-all hover:opacity-80" style={{ height: `${item.pageViews ? (item.pageViews / maxTraffic) * 100 : 2}%` }} title={String(item.pageViews)} />
                <span className="text-[10px] text-[var(--ink-soft)]">{item.label}</span>
              </div>
            ))}
          </div>
        </ACard>
        <ACard title="Revenue by package" sub="Confirmed + pending">
          <div className="space-y-4">
            {packages.map((p) => {
              const rev = bookings.filter((b) => b.pkgId === p.id).reduce((a, b) => a + b.paid, 0)
              const max = Math.max(1, ...packages.map((x) => bookings.filter((b) => b.pkgId === x.id).reduce((a, b) => a + b.paid, 0)))
              return (
                <div key={p.id}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{p.name}</span><span className="text-[var(--ink-soft)]">{inr(rev)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]"><div className="h-full rounded-full bg-gold" style={{ width: `${(rev / max) * 100}%` }} /></div>
                </div>
              )
            })}
          </div>
        </ACard>
      </div>

      {resetOpen && <TripleAnalyticsResetDialog busy={resetting} onClose={() => !resetting && setResetOpen(false)} onConfirm={handleReset} />}
    </div>
  )
}
