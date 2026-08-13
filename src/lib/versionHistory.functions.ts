import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' })
  if (!data) throw new Error('Forbidden')
}

export const listVersions = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const o = (raw ?? {}) as Record<string, unknown>
    return {
      module: typeof o.module === 'string' && o.module ? (o.module as string) : null,
      authorId: typeof o.authorId === 'string' && o.authorId ? (o.authorId as string) : null,
      from: typeof o.from === 'string' && o.from ? (o.from as string) : null,
      to: typeof o.to === 'string' && o.to ? (o.to as string) : null,
      limit: Math.min(Number(o.limit) || 50, 200),
      offset: Math.max(Number(o.offset) || 0, 0),
    }
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    let q = context.supabase
      .from('site_content_versions')
      .select('id, content_id, changed_modules, author_id, author_email, reason, source, restored_from_version_id, created_at', { count: 'exact' })
      .eq('content_id', 'main')
      .order('created_at', { ascending: false })
      .range(data.offset, data.offset + data.limit - 1)
    if (data.module) q = q.contains('changed_modules', [data.module])
    if (data.authorId) q = q.eq('author_id', data.authorId)
    if (data.from) q = q.gte('created_at', data.from)
    if (data.to) q = q.lte('created_at', data.to)
    const { data: rows, count, error } = await q
    if (error) throw new Error(error.message)
    return { rows: rows ?? [], count: count ?? 0 }
  })

export const getVersion = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const o = (raw ?? {}) as { id?: string }
    if (!o.id) throw new Error('id required')
    return { id: o.id }
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { data: row, error } = await context.supabase
      .from('site_content_versions')
      .select('*')
      .eq('id', data.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return row
  })

export const restoreVersion = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const o = (raw ?? {}) as { id?: string; reason?: string }
    if (!o.id) throw new Error('id required')
    return { id: o.id, reason: o.reason ?? undefined }
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { error } = await context.supabase.rpc('restore_site_content_version', {
      _version_id: data.id,
      _reason: data.reason ?? undefined,
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const deleteVersions = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const o = (raw ?? {}) as { ids?: string[] }
    if (!Array.isArray(o.ids) || o.ids.length === 0) throw new Error('ids required')
    return { ids: o.ids.filter((x): x is string => typeof x === 'string') }
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { error } = await context.supabase.from('site_content_versions').delete().in('id', data.ids)
    if (error) throw new Error(error.message)
    return { ok: true, deleted: data.ids.length }
  })

export type VersionRow = {
  id: string
  content_id: string
  changed_modules: string[]
  author_id: string | null
  author_email: string | null
  reason: string | null
  source: string
  restored_from_version_id: string | null
  created_at: string
}