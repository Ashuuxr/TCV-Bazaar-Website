import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export type TrackingProvider =
  | 'meta_pixel' | 'ga4' | 'gtm' | 'google_ads'
  | 'clarity' | 'tiktok' | 'linkedin' | 'custom'

type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[]
export interface TrackingRow {
  id: string
  provider: TrackingProvider
  enabled: boolean
  tracking_id: string | null
  custom_code: string | null
  config: Json
  load_on_admin: boolean
  updated_at: string
  updated_by: string | null
}

export interface PublicTrackingRow {
  provider: TrackingProvider
  enabled: boolean
  tracking_id: string | null
  custom_code: string | null
  config: Json
  load_on_admin: boolean
}

// Validation regexes per provider.
export const TRACKING_ID_RE: Record<Exclude<TrackingProvider, 'custom'>, RegExp> = {
  meta_pixel: /^\d{15,16}$/,
  ga4:        /^G-[A-Z0-9]{6,}$/i,
  gtm:        /^GTM-[A-Z0-9]{4,}$/i,
  google_ads: /^AW-\d{6,}$/i,
  clarity:    /^[a-z0-9]{8,15}$/i,
  tiktok:     /^C[A-Z0-9]{18,24}$/i,
  linkedin:   /^\d{5,10}$/,
}

function validateInput(p: TrackingProvider, id: string | null, custom: string | null) {
  if (p === 'custom') {
    if (!custom || !custom.trim()) throw new Error('Custom code cannot be empty')
    if (custom.length > 20000) throw new Error('Custom code too large')
    return
  }
  if (!id || !id.trim()) throw new Error('Tracking ID is required')
  const re = TRACKING_ID_RE[p]
  if (!re.test(id.trim())) throw new Error(`Invalid ${p} ID format`)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function assertSuperAdmin(context: any) {
  const { data } = await context.supabase
    .from('user_roles').select('role').eq('user_id', context.userId)
  const roles = (data ?? []).map((r: { role: string }) => r.role)
  if (!roles.includes('super_admin')) throw new Error('Forbidden: Super Admin only')
}

/** Public — enabled integrations only, safe columns. Used by the browser loader. */
export const listTrackingIntegrations = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PublicTrackingRow[]> => {
    // Table is admin-only in RLS + no anon grants; read via the server
    // service-role client and project only the fields the browser needs
    // to inject vendor scripts. Never throw to the public loader — a
    // failed tracking fetch must not blank the site.
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      const { data, error } = await supabaseAdmin
        .from('tracking_integrations')
        .select('provider, enabled, tracking_id, custom_code, config, load_on_admin')
        .eq('enabled', true)
      if (error) return []
      return (data ?? []) as PublicTrackingRow[]
    } catch {
      return []
    }
  },
)

/** Admin — every row, super admin only. */
export const listAllTrackingIntegrations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrackingRow[]> => {
    await assertSuperAdmin(context)
    const { data, error } = await context.supabase
      .from('tracking_integrations')
      .select('*')
      .order('provider')
    if (error) throw new Error(error.message)
    return (data ?? []) as TrackingRow[]
  })

export const upsertTrackingIntegration = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((input: {
    provider: TrackingProvider
    enabled: boolean
    tracking_id?: string | null
    custom_code?: string | null
    config?: Json
    load_on_admin?: boolean
  }) => input)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context)
    const id = (data.tracking_id ?? '').trim() || null
    const code = (data.custom_code ?? '').trim() || null
    validateInput(data.provider, id, code)
    const payload: Record<string, unknown> = {
      provider: data.provider,
      enabled: !!data.enabled,
      tracking_id: id,
      custom_code: code,
      config: (data.config ?? {}) as Json,
      load_on_admin: !!data.load_on_admin,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    }
    const { error } = await context.supabase
      .from('tracking_integrations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(payload as any, { onConflict: 'provider' })
    if (error) throw new Error(error.message)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (context.supabase as any).rpc('log_user_audit', {
      _target_id: context.userId,
      _target_email: '',
      _action: 'tracking.upsert',
      _metadata: { provider: data.provider, enabled: data.enabled },
    }).then(() => undefined, () => undefined)
    return { ok: true as const }
  })

export const deleteTrackingIntegration = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((input: { provider: TrackingProvider }) => input)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context)
    const { error } = await context.supabase
      .from('tracking_integrations')
      .delete()
      .eq('provider', data.provider)
    if (error) throw new Error(error.message)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (context.supabase as any).rpc('log_user_audit', {
      _target_id: context.userId,
      _target_email: '',
      _action: 'tracking.delete',
      _metadata: { provider: data.provider },
    }).then(() => undefined, () => undefined)
    return { ok: true as const }
  })