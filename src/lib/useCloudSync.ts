import { useEffect, useRef } from 'react'
import { useCms } from '@/lib/store'
import type { Booking, Stall, StallStatus } from '@/lib/store'
import { listAllBookings, type BookingRow } from '@/lib/bookings.functions'
import { listStalls } from '@/lib/stallsPublic.functions'
import { getSiteContent, saveSiteContent } from '@/lib/siteContent.functions'
import { supabase } from '@/integrations/supabase/client'

/** Convert a DB booking row → app Booking shape. */
export function rowToBooking(r: BookingRow): Booking {
  return {
    id: r.invoice_number,
    dbId: r.id,
    createdAt: r.created_at,
    eventName: 'TCV Bazaar 2026 — Diwali Edition',
    pkgId: r.package_id ?? '',
    stallId: r.stall_id ?? '',
    business: r.business ?? {},
    payType: r.pay_type,
    method: r.method ?? '',
    total: r.total,
    subtotal: r.subtotal,
    gstRate: Number(r.gst_rate) || 0,
    gstAmount: r.gst_amount,
    paid: r.amount_paid,
    balance: r.balance,
    utr: r.utr ?? '',
    txnId: r.txn_id ?? '',
    proof: r.proof_url ?? '',
    remarks: r.remarks ?? '',
    status: r.status,
    payStatus: r.pay_status,
  }
}

type DbStallRow = {
  id: string; label: string; zone: string | null
  x: number; y: number; w: number; h: number
  pkg_id: string | null; status: StallStatus
  active: boolean; price_override: number | null; color: string | null; sort_order: number
}

/** CMS content keys stored in the shared cloud blob. */
const CMS_KEYS = [
  'theme', 'site', 'brand', 'hero', 'event', 'packages', 'gallery',
  'videos', 'testimonials', 'faqs', 'banks', 'pages', 'templates', 'media',
  'brochureSection',
] as const
type CmsKey = typeof CMS_KEYS[number]

/**
 * Module-level sync coordination.
 *  - `cloudHydrated`: flips true once the initial cloud fetch resolves. Auto-push
 *    is a no-op until then, so a slow network can't let stale localStorage
 *    overwrite fresher cloud content on admin mount.
 *  - `suppressPush`: true while we apply cloud values via `patch()` so the
 *    resulting store change doesn't echo back as a push.
 */
let cloudHydrated = false
let suppressPush = false

function applyCloudBlob(blob: Record<string, unknown>, patch: <K extends CmsKey>(k: K, v: unknown) => void) {
  suppressPush = true
  try {
    for (const k of CMS_KEYS) {
      const v = blob[k]
      if (v === undefined || v === null) continue
      patch(k, v as never)
    }
  } finally {
    // Flip back next tick so the resulting re-render's effect sees suppressPush=true.
    setTimeout(() => { suppressPush = false }, 0)
  }
}

/** Hydrate the full stall layout (geometry + status + package + colour + active flag) from the `stalls` table.
 *  Realtime subscription keeps every open tab in sync when the admin edits the layout. */
export function useSyncStallsFromCloud() {
  const patch = useCms((s) => s.patch)
  useEffect(() => {
    let cancelled = false
    const apply = (rows: DbStallRow[]) => {
      if (cancelled || !Array.isArray(rows)) return
      const mapped: Stall[] = rows.map((r) => ({
        id: r.id,
        label: r.label,
        zone: r.zone ?? '',
        x: Number(r.x), y: Number(r.y), w: Number(r.w), h: Number(r.h),
        pkgId: r.pkg_id ?? '',
        status: r.status,
        active: r.active,
        priceOverride: r.price_override,
        color: r.color,
        sortOrder: r.sort_order,
      }))
      suppressPush = true
      patch('stalls', mapped)
      setTimeout(() => { suppressPush = false }, 0)
    }
    const fetchStalls = () =>
      listStalls()
        .then((rows) => apply(rows as DbStallRow[]))
        .catch((err) => console.warn('[sync] listStalls failed', err))
    fetchStalls()
    ;(window as unknown as { __tcvRefetchStalls?: () => void }).__tcvRefetchStalls = fetchStalls
    const channel = supabase
      .channel('public:stalls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stalls' }, () => {
        fetchStalls()
      })
      .subscribe()
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchStalls()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVis)
      delete (window as unknown as { __tcvRefetchStalls?: () => void }).__tcvRefetchStalls
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Admin-only: pull all bookings from Cloud into Zustand. */
export function useSyncAdminBookings() {
  const patch = useCms((s) => s.patch)
  useEffect(() => {
    let cancelled = false
    let done = false
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      try {
        const rows = (await listAllBookings()) as unknown as BookingRow[]
        if (cancelled) return
        patch('bookings', rows.map(rowToBooking))
        done = true
      } catch { /* noop */ }
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session && !done) load()
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Public + admin: hydrate CMS blob from Cloud on mount, then keep in sync via realtime + tab-focus. */
export function useSyncSiteContent() {
  const patch = useCms((s) => s.patch)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      // Retry up to 3 times so a single edge blip doesn't leave the page
      // rendering Zustand defaults (which would then get pushed back over
      // fresher cloud content once cloudHydrated flips).
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = (await getSiteContent()) as { data?: Record<string, unknown>; ok?: boolean } | null
          if (cancelled) return
          // Only treat as hydrated once the server confirmed a successful read
          // (ok !== false). An `ok:false` means the DB call errored — do NOT
          // flip cloudHydrated, or we'd overwrite cloud with defaults.
          if (res && res.ok !== false) {
            const blob = (res.data ?? {}) as Record<string, unknown>
            applyCloudBlob(blob, patch as never)
            cloudHydrated = true
            return
          }
        } catch (err) {
          console.warn('[sync] getSiteContent failed', err)
        }
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      }
    }
    load()
    // Expose a manual refetch handle for callers that want to force a pull
    // (e.g. PublicLayout on route change).
    ;(window as unknown as { __tcvRefetchSiteContent?: () => void }).__tcvRefetchSiteContent = load

    // Live updates when admins save.
    const channel = supabase
      .channel('public:site_content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content', filter: 'id=eq.main' }, (payload) => {
        const row = (payload.new ?? payload.old) as { data?: Record<string, unknown> } | null
        if (!row?.data) return
        applyCloudBlob(row.data, patch as never)
      })
      .subscribe()

    // Fallback for browsers/networks with realtime disabled: refetch on tab focus.
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVis)
      delete (window as unknown as { __tcvRefetchSiteContent?: () => void }).__tcvRefetchSiteContent
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Admin: debounced push of CMS content to Cloud whenever tracked keys change. */
export function useAutoPushSiteContent() {
  const state = useCms()
  const pendingRef = useRef<Record<string, unknown> | null>(null)
  const savingRef = useRef(false)
  const trySave = async (payload: Record<string, unknown>) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await saveSiteContent({ data: payload as never })
        // Fan the fresh blob to any other open tab immediately, don't wait for realtime.
        const w = window as unknown as { __tcvRefetchSiteContent?: () => void }
        w.__tcvRefetchSiteContent?.()
        return true
      } catch (err) {
        console.warn(`[sync] saveSiteContent attempt ${attempt + 1} failed`, err)
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
      }
    }
    return false
  }
  const flush = async () => {
    const payload = pendingRef.current
    if (!payload || savingRef.current) return
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    savingRef.current = true
    const ok = await trySave(payload)
    if (ok) pendingRef.current = null
    savingRef.current = false
  }
  useEffect(() => {
    const onBeforeUnload = () => { void flush() }
    const onVis = () => { if (document.visibilityState === 'hidden') void flush() }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    // Do not push until we've hydrated from cloud, and never echo cloud-originated patches.
    if (!cloudHydrated || suppressPush) return
    let cancelled = false
    const payload: Record<string, unknown> = {}
    for (const k of CMS_KEYS) payload[k] = (state as unknown as Record<string, unknown>)[k]
    pendingRef.current = payload
    const t = setTimeout(async () => {
      if (cancelled) return
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      if (savingRef.current) return
      savingRef.current = true
      const ok = await trySave(payload)
      if (ok) pendingRef.current = null
      savingRef.current = false
    }, 1200)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, CMS_KEYS.map((k) => (state as unknown as Record<string, unknown>)[k]))
}