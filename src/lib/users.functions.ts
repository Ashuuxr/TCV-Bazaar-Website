import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export type AppRole = 'super_admin' | 'admin' | 'finance' | 'manager' | 'editor' | 'customer'
export const MANAGEABLE_ROLES: AppRole[] = ['super_admin', 'admin', 'finance', 'manager', 'editor']

export interface UserRow {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  business_name: string | null
  status: 'active' | 'suspended'
  is_owner: boolean
  created_at: string
  roles: {
    role: AppRole
    assigned_by: string | null
    assigned_by_email: string | null
    assigned_at: string
  }[]
}

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[]
export interface AuditRow {
  id: string
  actor_id: string | null
  actor_email: string | null
  target_id: string | null
  target_email: string | null
  action: string
  from_role: AppRole | null
  to_role: AppRole | null
  metadata: Json
  created_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCallerRoles(context: any): Promise<AppRole[]> {
  const { data, error } = await context.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.userId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: { role: AppRole }) => r.role)
}

function requireRole(roles: AppRole[], allowed: AppRole[]) {
  if (!roles.some((r) => allowed.includes(r))) throw new Error('Forbidden')
}

function isManageable(role: string): role is AppRole {
  return (MANAGEABLE_ROLES as string[]).includes(role)
}

/** List every user + roles. Admin+ only. */
export const listUsers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getCallerRoles(context)
    requireRole(roles, ['super_admin', 'admin'])
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: profiles, error: perr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, phone, business_name, status, is_owner, created_at')
      .order('created_at', { ascending: false })
    if (perr) throw new Error(perr.message)

    const { data: allRoles, error: rerr } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, assigned_by, assigned_at')
    if (rerr) throw new Error(rerr.message)

    // Build email map for assigned_by
    const assignerIds = Array.from(new Set((allRoles ?? []).map((r) => r.assigned_by).filter(Boolean))) as string[]
    const assignerMap = new Map<string, string>()
    if (assignerIds.length) {
      const { data: aps } = await supabaseAdmin.from('profiles').select('id, email').in('id', assignerIds)
      for (const p of aps ?? []) if (p.email) assignerMap.set(p.id as string, p.email as string)
    }

    const byUser = new Map<string, UserRow['roles']>()
    for (const r of allRoles ?? []) {
      const arr = byUser.get(r.user_id as string) ?? []
      arr.push({
        role: r.role as AppRole,
        assigned_by: (r.assigned_by as string | null) ?? null,
        assigned_by_email: r.assigned_by ? assignerMap.get(r.assigned_by as string) ?? null : null,
        assigned_at: r.assigned_at as string,
      })
      byUser.set(r.user_id as string, arr)
    }

    return (profiles ?? []).map((p) => ({
      ...p,
      roles: byUser.get(p.id as string) ?? [],
    })) as UserRow[]
  })

/** Invite a new user by email; they receive a magic link to set password. */
export const inviteUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { email?: string; role?: string; fullName?: string }
    if (!r.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) throw new Error('Valid email required')
    if (!r.role || !isManageable(r.role)) throw new Error('Invalid role')
    return { email: r.email.toLowerCase(), role: r.role as AppRole, fullName: r.fullName ?? '' }
  })
  .handler(async ({ context, data }) => {
    const roles = await getCallerRoles(context)
    requireRole(roles, ['super_admin', 'admin'])
    if (data.role === 'super_admin') requireRole(roles, ['super_admin'])
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const siteUrl = process.env.SITE_URL || 'https://www.tcvbazaar.com'
    const { data: inv, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${siteUrl}/admin/reset-password`,
      data: { full_name: data.fullName },
    })
    if (error) throw new Error(error.message)
    const userId = inv.user?.id
    if (!userId) throw new Error('Invite failed')
    await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: data.role, assigned_by: context.userId })
    await (context.supabase.rpc as any)('log_user_audit', {
      _target_id: userId, _target_email: data.email, _action: 'invite',
      _from_role: null, _to_role: data.role, _metadata: { full_name: data.fullName },
    })
    return { ok: true, userId }
  })

/** Create user immediately with temp password. */
export const createUserWithPassword = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { email?: string; password?: string; role?: string; fullName?: string }
    if (!r.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) throw new Error('Valid email required')
    if (!r.password || r.password.length < 8) throw new Error('Password must be 8+ characters')
    if (!r.role || !isManageable(r.role)) throw new Error('Invalid role')
    return { email: r.email.toLowerCase(), password: r.password, role: r.role as AppRole, fullName: r.fullName ?? '' }
  })
  .handler(async ({ context, data }) => {
    const roles = await getCallerRoles(context)
    requireRole(roles, ['super_admin', 'admin'])
    if (data.role === 'super_admin') requireRole(roles, ['super_admin'])
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    })
    if (error) throw new Error(error.message)
    const userId = created.user?.id
    if (!userId) throw new Error('Create failed')
    await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: data.role, assigned_by: context.userId })
    await (context.supabase.rpc as any)('log_user_audit', {
      _target_id: userId, _target_email: data.email, _action: 'create',
      _from_role: null, _to_role: data.role, _metadata: { full_name: data.fullName },
    })
    return { ok: true, userId }
  })

/** Replace a user's roles with `roles` array. Only super admins may grant/revoke super_admin. */
export const setUserRoles = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { userId?: string; roles?: unknown }
    if (!r.userId) throw new Error('userId required')
    if (!Array.isArray(r.roles)) throw new Error('roles required')
    const roles = (r.roles as string[]).filter(isManageable)
    if (!roles.length) throw new Error('At least one role required')
    return { userId: r.userId, roles: Array.from(new Set(roles)) as AppRole[] }
  })
  .handler(async ({ context, data }) => {
    const callerRoles = await getCallerRoles(context)
    requireRole(callerRoles, ['super_admin', 'admin'])
    const isCallerSuper = callerRoles.includes('super_admin')
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: existing } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', data.userId)
    const existingRoles = new Set((existing ?? []).map((r) => r.role as AppRole))
    const nextRoles = new Set(data.roles)

    // Only super admins can touch super_admin status on any user
    const toucheSuper =
      existingRoles.has('super_admin') !== nextRoles.has('super_admin')
    if (toucheSuper && !isCallerSuper) throw new Error('Only Super Admins may change Super Admin status')

    const { data: target } = await supabaseAdmin.from('profiles').select('email').eq('id', data.userId).maybeSingle()
    const targetEmail = (target?.email as string | null) ?? null

    // Delete removed roles (trigger enforces last-super-admin)
    for (const r of existingRoles) {
      if (!nextRoles.has(r)) {
        const { error } = await supabaseAdmin
          .from('user_roles').delete().eq('user_id', data.userId).eq('role', r)
        if (error) throw new Error(error.message)
        await (context.supabase.rpc as any)('log_user_audit', {
          _target_id: data.userId, _target_email: targetEmail,
          _action: r === 'super_admin' ? 'demote' : 'role_change',
          _from_role: r, _to_role: null, _metadata: {},
        })
      }
    }
    // Insert added roles
    for (const r of nextRoles) {
      if (!existingRoles.has(r)) {
        const { error } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: data.userId, role: r, assigned_by: context.userId })
        if (error) throw new Error(error.message)
        await (context.supabase.rpc as any)('log_user_audit', {
          _target_id: data.userId, _target_email: targetEmail,
          _action: r === 'super_admin' ? 'promote' : 'role_change',
          _from_role: null, _to_role: r, _metadata: {},
        })
      }
    }
    return { ok: true }
  })

export const setUserStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { userId?: string; status?: string }
    if (!r.userId) throw new Error('userId required')
    if (r.status !== 'active' && r.status !== 'suspended') throw new Error('Invalid status')
    return { userId: r.userId, status: r.status as 'active' | 'suspended' }
  })
  .handler(async ({ context, data }) => {
    const callerRoles = await getCallerRoles(context)
    requireRole(callerRoles, ['super_admin', 'admin'])
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: target } = await supabaseAdmin.from('profiles').select('email').eq('id', data.userId).maybeSingle()
    const targetEmail = (target?.email as string | null) ?? null

    const { error: perr } = await supabaseAdmin
      .from('profiles').update({ status: data.status }).eq('id', data.userId)
    if (perr) throw new Error(perr.message)

    // Ban / unban in auth to actually block login
    const banDuration = data.status === 'suspended' ? '876000h' : 'none'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: aerr } = await (supabaseAdmin.auth.admin as any).updateUserById(data.userId, { ban_duration: banDuration })
    if (aerr) throw new Error(aerr.message)

    await (context.supabase.rpc as any)('log_user_audit', {
      _target_id: data.userId, _target_email: targetEmail,
      _action: data.status === 'suspended' ? 'suspend' : 'reactivate',
      _from_role: null, _to_role: null, _metadata: {},
    })
    return { ok: true }
  })

export const removeUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { userId?: string }
    if (!r.userId) throw new Error('userId required')
    return { userId: r.userId }
  })
  .handler(async ({ context, data }) => {
    const callerRoles = await getCallerRoles(context)
    requireRole(callerRoles, ['super_admin', 'admin'])
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    if (data.userId === context.userId) throw new Error('You cannot remove your own signed-in account.')

    const { data: target } = await supabaseAdmin.from('profiles').select('email, is_owner').eq('id', data.userId).maybeSingle()
    if (!target) throw new Error('User account was not found. Refresh the list and try again.')
    if (target.is_owner) throw new Error('Cannot remove the account owner. Transfer ownership first.')

    const { data: targetRoles } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', data.userId)
    if ((targetRoles ?? []).some((r) => r.role === 'super_admin') && !callerRoles.includes('super_admin')) {
      throw new Error('Only Super Admins may remove another Super Admin')
    }
    const targetEmail = (target?.email as string | null) ?? null

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId)
    if (error) throw new Error(error.message || 'Supabase could not delete this user account.')
    await (context.supabase.rpc as any)('log_user_audit', {
      _target_id: data.userId, _target_email: targetEmail,
      _action: 'remove', _from_role: null, _to_role: null, _metadata: {},
    })
    return { ok: true }
  })

export const resetUserPassword = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { userId?: string }
    if (!r.userId) throw new Error('userId required')
    return { userId: r.userId }
  })
  .handler(async ({ context, data }) => {
    const callerRoles = await getCallerRoles(context)
    requireRole(callerRoles, ['super_admin', 'admin'])
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: target } = await supabaseAdmin.from('profiles').select('email').eq('id', data.userId).maybeSingle()
    const targetEmail = target?.email as string | null
    if (!targetEmail) throw new Error('User email not found')

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${process.env.SITE_URL || 'https://www.tcvbazaar.com'}/admin/reset-password`,
    })
    if (error) throw new Error(error.message)
    await (context.supabase.rpc as any)('log_user_audit', {
      _target_id: data.userId, _target_email: targetEmail,
      _action: 'password_reset', _from_role: null, _to_role: null, _metadata: {},
    })
    return { ok: true }
  })

export const transferOwnership = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { toUserId?: string }
    if (!r.toUserId) throw new Error('toUserId required')
    return { toUserId: r.toUserId }
  })
  .handler(async ({ context, data }) => {
    const callerRoles = await getCallerRoles(context)
    requireRole(callerRoles, ['super_admin'])
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: caller } = await supabaseAdmin.from('profiles').select('id, is_owner').eq('id', context.userId).maybeSingle()
    if (!caller?.is_owner) throw new Error('Only the current owner may transfer ownership')

    // Ensure target has super_admin
    await supabaseAdmin.from('user_roles').upsert(
      { user_id: data.toUserId, role: 'super_admin', assigned_by: context.userId },
      { onConflict: 'user_id,role' },
    )
    await supabaseAdmin.from('profiles').update({ is_owner: false }).eq('id', context.userId)
    const { error } = await supabaseAdmin.from('profiles').update({ is_owner: true }).eq('id', data.toUserId)
    if (error) throw new Error(error.message)

    const { data: target } = await supabaseAdmin.from('profiles').select('email').eq('id', data.toUserId).maybeSingle()
    await (context.supabase.rpc as any)('log_user_audit', {
      _target_id: data.toUserId, _target_email: (target?.email as string | null) ?? null,
      _action: 'ownership_transfer', _from_role: null, _to_role: 'super_admin', _metadata: { from_user_id: context.userId },
    })
    return { ok: true }
  })

export const listAuditLog = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = (raw ?? {}) as { limit?: number; action?: string }
    return { limit: Math.min(Math.max(Number(r.limit ?? 200), 1), 500), action: r.action ?? '' }
  })
  .handler(async ({ context, data }) => {
    const callerRoles = await getCallerRoles(context)
    requireRole(callerRoles, ['super_admin', 'admin'])
    let q = context.supabase.from('user_audit_log').select('*').order('created_at', { ascending: false }).limit(data.limit)
    if (data.action) q = q.eq('action', data.action)
    const { data: rows, error } = await q
    if (error) throw new Error(error.message)
    return (rows ?? []) as AuditRow[]
  })

/** Lightweight self-check for UI gating. */
export const getMyRoles = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getCallerRoles(context)
    return { userId: context.userId as string, roles }
  })