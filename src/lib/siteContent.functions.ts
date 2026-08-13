import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

type Json = string | number | boolean | null | { [k: string]: Json } | Json[]

/** Public: fetch full CMS content blob.
 *  Uses the publishable-key server client so a transient service-role /
 *  edge worker failure can't crash the public loader. The `site_content`
 *  table already has an anon SELECT policy + grants for the `main` row. */
export const getSiteContent = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const url = process.env.SUPABASE_URL!
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers)
          if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization')
          h.set('apikey', key)
          return fetch(input, { ...init, headers: h })
        },
      },
    })
    const { data, error } = await supabase
      .from('site_content')
      .select('data, updated_at')
      .eq('id', 'main')
      .maybeSingle()
    if (error) return { data: {} as Json, updatedAt: null as string | null, ok: false as boolean }
    const blob = (data?.data ?? {}) as Json
    return { data: blob, updatedAt: (data?.updated_at ?? null) as string | null, ok: true }
  } catch {
    return { data: {} as Json, updatedAt: null as string | null, ok: false }
  }
})

/** Admin: save (upsert) full CMS content blob. */
export const saveSiteContent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const obj = raw as { data?: unknown; reason?: unknown }
    const data = (obj.data ?? raw) as Json
    const reason = typeof obj.reason === 'string' ? obj.reason : null
    return { data, reason }
  })
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc('save_site_content', {
      _data: data.data as never,
      _reason: data.reason ?? undefined,
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })
