import { useEffect, useState } from 'react'
import { KeyRound, ShieldCheck, Smartphone, Users, Loader2, RefreshCw } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { supabase } from '@/integrations/supabase/client'
import { ACard } from './ui'
import { getMyRoles, listAuditLog, type AppRole, type AuditRow } from '@/lib/users.functions'

const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  finance: 'Finance',
  manager: 'Manager',
  editor: 'Editor',
  customer: 'Customer',
}

export default function Settings() {
  const rolesCall = useServerFn(getMyRoles)
  const auditCall = useServerFn(listAuditLog)
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<AppRole[]>([])
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [err, setErr] = useState('')

  const load = async (background = false) => {
    if (background) setRefreshing(true)
    else setLoading(true)
    setErr('')
    try {
      const [{ data: userData, error: userError }, access, auditRows] = await Promise.all([
        supabase.auth.getUser(),
        rolesCall(),
        auditCall({ data: { limit: 60, action: '' } }),
      ])
      if (userError) throw new Error(userError.message)
      setEmail(userData.user?.email ?? '')
      setRoles(access.roles)
      setAudit(auditRows)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load security settings.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-[var(--ink-soft)]"><Loader2 className="mr-2 animate-spin" size={16} /> Loading real security settings…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Settings & Security</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Live Supabase account, roles, session guidance and database audit history.</p>
        </div>
        <button onClick={() => void load(true)} disabled={refreshing} className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {err && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <ACard title="Admin login" sub="Managed by Supabase Auth">
          <div className="space-y-5">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Signed-in email</div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium">{email || 'Unavailable'}</div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-4 text-xs leading-relaxed text-[var(--ink-soft)]">
              Passwords are managed securely by Supabase Auth and are never stored in the browser CMS state. Use the password-reset flow from the admin login screen to change the password.
            </div>
            <a href="/admin/login" className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)] px-5 py-2.5 text-xs font-semibold text-[var(--ink)]">
              <KeyRound size={14} /> Open password-reset screen
            </a>
          </div>
        </ACard>

        <ACard title="Roles & sessions" sub="Read-only values from Supabase Auth and user_roles">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><ShieldCheck size={16} /></span>
              <div><div className="text-sm font-semibold">Current account</div><div className="text-xs text-[var(--ink-soft)]">{email || 'Authenticated admin'}</div></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.length === 0 ? <span className="text-xs text-[var(--ink-soft)]">No roles returned</span> : roles.map((role) => (
                <span key={role} className="rounded-full border border-[var(--line)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-semibold text-gold">{ROLE_LABEL[role]}</span>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><Users size={16} /></span>
              <div><div className="text-sm font-semibold">Session</div><div className="text-xs text-[var(--ink-soft)]">This browser session is managed by Supabase Auth. Sign out clears it immediately.</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <Smartphone size={16} />
              <div className="text-xs leading-relaxed">Two-factor authentication is not implemented as a local toggle. Do not enable a setting here that is not enforced by Supabase Auth.</div>
            </div>
          </div>
        </ACard>
      </div>

      <ACard title="Database Audit Log" sub="The latest real records from public.user_audit_log">
        <div className="max-h-80 overflow-y-auto text-xs">
          {audit.length === 0 ? (
            <p className="py-6 text-center text-[var(--ink-soft)]">No database audit entries yet. A successful admin login or protected admin action will create one.</p>
          ) : (
            <div className="space-y-2">
              {audit.map((a) => (
                <div key={a.id} className="flex flex-wrap justify-between gap-4 border-b border-[var(--line)] pb-2">
                  <span><strong className="capitalize">{a.action.replaceAll('_', ' ')}</strong> · {a.actor_email ?? a.actor_id ?? 'Unknown actor'}</span>
                  <span className="shrink-0 text-[var(--ink-soft)]">{new Date(a.created_at).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ACard>
    </div>
  )
}
