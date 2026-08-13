import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export interface BrochureRow {
  id: string
  title: string
  description: string | null
  event_id: string | null
  file_path: string
  file_name: string
  file_size: number
  is_active: boolean
  is_archived: boolean
  sort_order: number
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface BrochureVersionRow {
  id: string
  brochure_id: string
  file_path: string
  file_name: string
  file_size: number
  title: string | null
  description: string | null
  replaced_by: string | null
  created_at: string
}

export interface PublicBrochure {
  id: string
  title: string
  description: string | null
  file_name: string
  signed_url: string
  expires_at: number
}

const SIGN_TTL_SECONDS = 60 * 30 // 30 minutes

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertBrochureAdmin(context: any) {
  const { data, error } = await context.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.userId)
  if (error) throw new Error(error.message)
  const roles = (data ?? []).map((r: { role: string }) => r.role)
  if (!roles.some((r: string) => r === 'super_admin' || r === 'admin')) throw new Error('Forbidden')
}

function s(v: unknown): string | null {
  if (v == null) return null
  const t = String(v).trim()
  return t ? t : null
}

/** Admin: list brochures (optionally including archived). */
export const adminListBrochures = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { includeArchived?: unknown }
    return { includeArchived: !!r.includeArchived }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    let q = context.supabase
      .from('brochures')
      .select('*')
      .order('is_active', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (!data.includeArchived) q = q.eq('is_archived', false)
    const { data: rows, error } = await q
    if (error) throw new Error(error.message)
    return (rows ?? []) as BrochureRow[]
  })

/** Admin: create a brochure row after uploading the file to storage. */
export const createBrochure = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.title || typeof r.title !== 'string') throw new Error('title required')
    if (!r.file_path || typeof r.file_path !== 'string') throw new Error('file_path required')
    if (!r.file_name || typeof r.file_name !== 'string') throw new Error('file_name required')
    return {
      title: r.title.trim().slice(0, 200),
      description: s(r.description),
      event_id: s(r.event_id),
      file_path: r.file_path,
      file_name: r.file_name,
      file_size: Number(r.file_size) || 0,
      activate: !!r.activate,
    }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    if (data.activate) {
      const clear = context.supabase.from('brochures').update({ is_active: false } as never).eq('is_archived', false)
      if (data.event_id == null) await clear.is('event_id', null)
      else await clear.eq('event_id', data.event_id)
    }
    const { data: row, error } = await context.supabase
      .from('brochures')
      .insert({
        title: data.title,
        description: data.description,
        event_id: data.event_id,
        file_path: data.file_path,
        file_name: data.file_name,
        file_size: data.file_size,
        is_active: data.activate,
        uploaded_by: context.userId,
      } as never)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return row as BrochureRow
  })

/** Admin: edit metadata only. */
export const updateBrochureMeta = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.id || typeof r.id !== 'string') throw new Error('id required')
    return {
      id: r.id,
      title: r.title == null ? undefined : String(r.title).trim().slice(0, 200),
      description: r.description === undefined ? undefined : s(r.description),
      event_id: r.event_id === undefined ? undefined : s(r.event_id),
    }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    const patch: Record<string, unknown> = {}
    if (data.title !== undefined) patch.title = data.title
    if (data.description !== undefined) patch.description = data.description
    if (data.event_id !== undefined) patch.event_id = data.event_id
    if (Object.keys(patch).length === 0) return { ok: true }
    const { error } = await context.supabase.from('brochures').update(patch as never).eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

/** Admin: replace file. Previous file is snapshotted into version history. */
export const replaceBrochureFile = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.id || typeof r.id !== 'string') throw new Error('id required')
    if (!r.file_path || typeof r.file_path !== 'string') throw new Error('file_path required')
    if (!r.file_name || typeof r.file_name !== 'string') throw new Error('file_name required')
    return { id: r.id, file_path: r.file_path, file_name: r.file_name, file_size: Number(r.file_size) || 0 }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    const { data: current, error: e1 } = await context.supabase
      .from('brochures').select('*').eq('id', data.id).single()
    if (e1 || !current) throw new Error(e1?.message || 'Not found')
    await context.supabase.from('brochure_versions').insert({
      brochure_id: current.id,
      file_path: current.file_path,
      file_name: current.file_name,
      file_size: current.file_size,
      title: current.title,
      description: current.description,
      replaced_by: context.userId,
    } as never)
    const { error: e2 } = await context.supabase.from('brochures').update({
      file_path: data.file_path,
      file_name: data.file_name,
      file_size: data.file_size,
    } as never).eq('id', data.id)
    if (e2) throw new Error(e2.message)
    return { ok: true }
  })

/** Admin: set active (unsets other siblings in the same event scope). */
export const setActiveBrochure = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.id || typeof r.id !== 'string') throw new Error('id required')
    return { id: r.id, active: r.active === undefined ? true : !!r.active }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    const { data: row, error: e0 } = await context.supabase
      .from('brochures').select('event_id, is_archived').eq('id', data.id).single()
    if (e0 || !row) throw new Error(e0?.message || 'Not found')
    if (row.is_archived) throw new Error('Cannot activate an archived brochure')
    if (data.active) {
      // Clear siblings in same event scope first
      const q = context.supabase.from('brochures').update({ is_active: false } as never).eq('is_archived', false).neq('id', data.id)
      if (row.event_id == null) await q.is('event_id', null)
      else await q.eq('event_id', row.event_id)
    }
    const { error } = await context.supabase.from('brochures').update({ is_active: data.active } as never).eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

/** Admin: archive/unarchive. Archiving also deactivates. */
export const setBrochureArchived = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.id || typeof r.id !== 'string') throw new Error('id required')
    return { id: r.id, archived: !!r.archived }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    const patch: Record<string, unknown> = { is_archived: data.archived }
    if (data.archived) patch.is_active = false
    const { error } = await context.supabase.from('brochures').update(patch as never).eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

/** Admin: delete brochure + all versions + storage objects. */
export const deleteBrochure = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.id || typeof r.id !== 'string') throw new Error('id required')
    return { id: r.id }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    const { data: current } = await context.supabase.from('brochures').select('file_path').eq('id', data.id).maybeSingle()
    const { data: versions } = await context.supabase.from('brochure_versions').select('file_path').eq('brochure_id', data.id)
    const paths = [current?.file_path, ...(versions ?? []).map((v: { file_path: string }) => v.file_path)].filter(Boolean) as string[]
    if (paths.length) await context.supabase.storage.from('brochures').remove(paths)
    const { error } = await context.supabase.from('brochures').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

/** Admin: list version history for a brochure. */
export const listBrochureVersions = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.brochure_id || typeof r.brochure_id !== 'string') throw new Error('brochure_id required')
    return { brochure_id: r.brochure_id }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    const { data: rows, error } = await context.supabase
      .from('brochure_versions')
      .select('*')
      .eq('brochure_id', data.brochure_id)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (rows ?? []) as BrochureVersionRow[]
  })

/** Admin: restore a version → swap current file with version file, pushing current to history. */
export const restoreBrochureVersion = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.version_id || typeof r.version_id !== 'string') throw new Error('version_id required')
    return { version_id: r.version_id }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    const { data: v, error: e1 } = await context.supabase
      .from('brochure_versions').select('*').eq('id', data.version_id).single()
    if (e1 || !v) throw new Error(e1?.message || 'Version not found')
    const { data: current, error: e2 } = await context.supabase
      .from('brochures').select('*').eq('id', v.brochure_id).single()
    if (e2 || !current) throw new Error(e2?.message || 'Brochure not found')
    // Snapshot current to history
    await context.supabase.from('brochure_versions').insert({
      brochure_id: current.id,
      file_path: current.file_path,
      file_name: current.file_name,
      file_size: current.file_size,
      title: current.title,
      description: current.description,
      replaced_by: context.userId,
    } as never)
    // Swap: point brochure to the version file
    const { error: e3 } = await context.supabase.from('brochures').update({
      file_path: v.file_path,
      file_name: v.file_name,
      file_size: v.file_size,
    } as never).eq('id', current.id)
    if (e3) throw new Error(e3.message)
    return { ok: true }
  })

/** Admin: signed URL for preview. */
export const getBrochureAdminSignedUrl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>
    if (!r.file_path || typeof r.file_path !== 'string') throw new Error('file_path required')
    return { file_path: r.file_path }
  })
  .handler(async ({ context, data }) => {
    await assertBrochureAdmin(context)
    const { data: signed, error } = await context.supabase
      .storage.from('brochures').createSignedUrl(data.file_path, SIGN_TTL_SECONDS)
    if (error || !signed?.signedUrl) throw new Error(error?.message || 'Sign failed')
    return { url: signed.signedUrl, expires_at: Date.now() + SIGN_TTL_SECONDS * 1000 }
  })

/** Public: fetch currently active brochure (if section enabled). */
export const getActivePublicBrochure = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  // Section toggle
  const { data: cms } = await supabaseAdmin
    .from('site_content').select('data').eq('id', 'main').maybeSingle()
  const section = (cms?.data as { brochureSection?: { enabled?: boolean } } | null)?.brochureSection
  if (section && section.enabled === false) return null
  const { data: row } = await supabaseAdmin
    .from('brochures')
    .select('id, title, description, file_path, file_name')
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('event_id', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!row) return null
  const { data: signed } = await supabaseAdmin
    .storage.from('brochures').createSignedUrl(row.file_path, SIGN_TTL_SECONDS)
  if (!signed?.signedUrl) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    file_name: row.file_name,
    signed_url: signed.signedUrl,
    expires_at: Date.now() + SIGN_TTL_SECONDS * 1000,
  } as PublicBrochure
})