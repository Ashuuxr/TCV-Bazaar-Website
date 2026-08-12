import { useCallback, useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Loader2, Mail, UserPlus, Shield, ShieldCheck, RotateCw, Ban, CheckCircle2, Trash2, Crown, X } from 'lucide-react'
import { ACard, Field } from './ui'
import {
  listUsers, inviteUser, createUserWithPassword, setUserRoles, setUserStatus,
  removeUser, resetUserPassword, transferOwnership, getMyRoles,
  MANAGEABLE_ROLES, type AppRole, type UserRow,
} from '@/lib/users.functions'

const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: 'Super Admin', admin: 'Admin', finance: 'Finance', manager: 'Manager', editor: 'Editor', customer: 'Customer',
}
const ROLE_COLOR: Record<AppRole, string> = {
  super_admin: 'bg-amber-100 text-amber-800 border-amber-300',
  admin: 'bg-blue-100 text-blue-800 border-blue-300',
  finance: 'bg-teal-100 text-teal-800 border-teal-300',
  manager: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  editor: 'bg-purple-100 text-purple-800 border-purple-300',
  customer: 'bg-gray-100 text-gray-700 border-gray-300',
}

export default function UserManager() {
  const call = {
    list: useServerFn(listUsers),
    invite: useServerFn(inviteUser),
    create: useServerFn(createUserWithPassword),
    roles: useServerFn(setUserRoles),
    status: useServerFn(setUserStatus),
    remove: useServerFn(removeUser),
    reset: useServerFn(resetUserPassword),
    transfer: useServerFn(transferOwnership),
    me: useServerFn(getMyRoles),
  }
  const [users, setUsers] = useState<UserRow[]>([])
  const [myRoles, setMyRoles] = useState<AppRole[]>([])
  const [myId, setMyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')
  const [busy, setBusy] = useState<string>('')
  const [showInvite, setShowInvite] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [confirm, setConfirm] = useState<{ msg: string; onOk: () => void } | null>(null)

  const isSuper = myRoles.includes('super_admin')
  const activeSuperCount = useMemo(
    () => users.filter((u) => u.status === 'active' && u.roles.some((r) => r.role === 'super_admin')).length,
    [users],
  )

  const refresh = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const [rows, me] = await Promise.all([call.list(), call.me()])
      setUsers(rows); setMyRoles(me.roles); setMyId(me.userId)
    } catch (e) { setErr((e as Error).message) }
    finally { setLoading(false) }
  }, [call])

  useEffect(() => { void refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const withBusy = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id); setErr('')
    try { await fn(); await refresh() }
    catch (e) { setErr((e as Error).message) }
    finally { setBusy('') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {users.length} users · {activeSuperCount} active Super Admin{activeSuperCount === 1 ? '' : 's'}
            {' · '}Role-based access controls the entire admin dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowInvite(true)} className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold">
            <Mail size={13} /> Invite user
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold">
            <UserPlus size={13} /> Create user
          </button>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      <ACard>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--ink-soft)]"><Loader2 size={16} className="animate-spin" /> Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-[var(--ink-soft)]">
                <tr><th className="py-2 pr-4">User</th><th className="pr-4">Roles</th><th className="pr-4">Status</th><th className="pr-4">Assigned by</th><th className="pr-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSuperTarget = u.roles.some((r) => r.role === 'super_admin')
                  const lastActiveSuper = isSuperTarget && u.status === 'active' && activeSuperCount <= 1
                  const canModify = isSuper || !isSuperTarget
                  const canRemove = canModify && !u.is_owner && !lastActiveSuper && u.id !== myId
                  const superAssigner = u.roles.find((r) => r.role === 'super_admin')
                  return (
                    <tr key={u.id} className="border-t border-[var(--line)] align-top">
                      <td className="py-3 pr-4">
                        <div className="font-semibold">{u.full_name || '—'} {u.is_owner && <Crown size={12} className="inline text-amber-500" aria-label="Owner" />}</div>
                        <div className="text-xs text-[var(--ink-soft)]">{u.email}</div>
                      </td>
                      <td className="pr-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 && <span className="text-xs text-[var(--ink-soft)]">No role</span>}
                          {u.roles.map((r) => (
                            <span key={r.role} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ROLE_COLOR[r.role]}`}>{ROLE_LABEL[r.role]}</span>
                          ))}
                        </div>
                      </td>
                      <td className="pr-4">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${u.status === 'active' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-red-300 bg-red-50 text-red-700'}`}>{u.status}</span>
                      </td>
                      <td className="pr-4 text-xs text-[var(--ink-soft)]">
                        {superAssigner ? (
                          <>
                            {superAssigner.assigned_by_email ?? '—'}
                            <div>{new Date(superAssigner.assigned_at).toLocaleDateString()}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td className="pr-0 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button disabled={!canModify || busy === u.id} onClick={() => setEditingUser(u)} className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-semibold disabled:opacity-40">
                            <Shield size={11} className="inline" /> Roles
                          </button>
                          <button disabled={busy === u.id} onClick={() => withBusy(u.id, () => call.reset({ data: { userId: u.id } }))} className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-semibold disabled:opacity-40">
                            <RotateCw size={11} className="inline" /> Reset pw
                          </button>
                          {u.status === 'active' ? (
                            <button disabled={!canModify || busy === u.id || lastActiveSuper} onClick={() => setConfirm({ msg: `Suspend ${u.email}? They will not be able to sign in.`, onOk: () => withBusy(u.id, () => call.status({ data: { userId: u.id, status: 'suspended' } })) })} className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800 disabled:opacity-40">
                              <Ban size={11} className="inline" /> Suspend
                            </button>
                          ) : (
                            <button disabled={busy === u.id} onClick={() => withBusy(u.id, () => call.status({ data: { userId: u.id, status: 'active' } }))} className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 disabled:opacity-40">
                              <CheckCircle2 size={11} className="inline" /> Reactivate
                            </button>
                          )}
                          {isSuper && u.is_owner === false && isSuperTarget && u.id !== myId && (
                            <button disabled={busy === u.id} onClick={() => setConfirm({ msg: `Transfer OWNERSHIP to ${u.email}? You will remain a Super Admin but they become the account owner.`, onOk: () => withBusy(u.id, () => call.transfer({ data: { toUserId: u.id } })) })} className="rounded-full border border-amber-400 bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900 disabled:opacity-40">
                              <Crown size={11} className="inline" /> Transfer own.
                            </button>
                          )}
                          <button disabled={!canRemove || busy === u.id} onClick={() => setConfirm({ msg: `Permanently remove ${u.email}? This deletes the account and cannot be undone.`, onOk: () => withBusy(u.id, () => call.remove({ data: { userId: u.id } })) })} className="rounded-full border border-red-300 px-2.5 py-1 text-[10px] font-semibold text-red-500 disabled:opacity-40">
                            <Trash2 size={11} className="inline" /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ACard>

      {showInvite && (
        <InviteModal
          isSuper={isSuper}
          onClose={() => setShowInvite(false)}
          onSubmit={async (email, role, fullName) => {
            await call.invite({ data: { email, role, fullName } })
            setShowInvite(false); await refresh()
          }}
        />
      )}
      {showCreate && (
        <CreateModal
          isSuper={isSuper}
          onClose={() => setShowCreate(false)}
          onSubmit={async (email, password, role, fullName) => {
            await call.create({ data: { email, password, role, fullName } })
            setShowCreate(false); await refresh()
          }}
        />
      )}
      {editingUser && (
        <RolesModal
          user={editingUser} isSuper={isSuper}
          onClose={() => setEditingUser(null)}
          onSave={async (roles) => {
            await call.roles({ data: { userId: editingUser.id, roles } })
            setEditingUser(null); await refresh()
          }}
        />
      )}
      {confirm && (
        <ConfirmModal
          msg={confirm.msg}
          onCancel={() => setConfirm(null)}
          onOk={() => { const fn = confirm.onOk; setConfirm(null); fn() }}
        />
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--card-bg)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-medium">{title}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function RoleSelect({ value, onChange, isSuper }: { value: AppRole; onChange: (r: AppRole) => void; isSuper: boolean }) {
  return (
    <select className="input-lux" value={value} onChange={(e) => onChange(e.target.value as AppRole)}>
      {MANAGEABLE_ROLES.filter((r) => isSuper || r !== 'super_admin').map((r) => (
        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
      ))}
    </select>
  )
}

function InviteModal({ isSuper, onClose, onSubmit }: { isSuper: boolean; onClose: () => void; onSubmit: (email: string, role: AppRole, fullName: string) => Promise<void> }) {
  const [email, setEmail] = useState(''); const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<AppRole>('editor'); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  return (
    <Modal title="Invite user by email" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Email"><input className="input-lux" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Full name (optional)"><input className="input-lux" value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Role"><RoleSelect value={role} onChange={setRole} isSuper={isSuper} /></Field>
        {err && <div className="text-xs text-red-600">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-outline-gold rounded-full px-4 py-2 text-xs font-semibold">Cancel</button>
          <button disabled={busy} onClick={async () => { setBusy(true); setErr(''); try { await onSubmit(email, role, fullName) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) } }} className="btn-gold rounded-full px-4 py-2 text-xs font-semibold">
            {busy ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function CreateModal({ isSuper, onClose, onSubmit }: { isSuper: boolean; onClose: () => void; onSubmit: (email: string, pw: string, role: AppRole, fullName: string) => Promise<void> }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<AppRole>('editor'); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  return (
    <Modal title="Create user with password" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Email"><input className="input-lux" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Temporary password (min 8 chars)"><input className="input-lux" type="text" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Full name (optional)"><input className="input-lux" value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Role"><RoleSelect value={role} onChange={setRole} isSuper={isSuper} /></Field>
        {err && <div className="text-xs text-red-600">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-outline-gold rounded-full px-4 py-2 text-xs font-semibold">Cancel</button>
          <button disabled={busy} onClick={async () => { setBusy(true); setErr(''); try { await onSubmit(email, pw, role, fullName) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) } }} className="btn-gold rounded-full px-4 py-2 text-xs font-semibold">
            {busy ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function RolesModal({ user, isSuper, onClose, onSave }: { user: UserRow; isSuper: boolean; onClose: () => void; onSave: (roles: AppRole[]) => Promise<void> }) {
  const [sel, setSel] = useState<Set<AppRole>>(new Set(user.roles.map((r) => r.role).filter((r): r is AppRole => (MANAGEABLE_ROLES as string[]).includes(r))))
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const toggle = (r: AppRole) => { const s = new Set(sel); s.has(r) ? s.delete(r) : s.add(r); setSel(s) }
  return (
    <Modal title={`Roles for ${user.email}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {MANAGEABLE_ROLES.map((r) => {
            const disabled = r === 'super_admin' && !isSuper
            const active = sel.has(r)
            return (
              <button key={r} disabled={disabled} onClick={() => toggle(r)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)]'} ${disabled ? 'opacity-40' : ''}`}>
                {active && <ShieldCheck size={12} className="mr-1 inline" />}{ROLE_LABEL[r]}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-[var(--ink-soft)]">Users can hold multiple roles simultaneously. Only Super Admins can grant or revoke the Super Admin role.</p>
        {err && <div className="text-xs text-red-600">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-outline-gold rounded-full px-4 py-2 text-xs font-semibold">Cancel</button>
          <button disabled={busy || sel.size === 0} onClick={async () => { setBusy(true); setErr(''); try { await onSave(Array.from(sel)) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) } }} className="btn-gold rounded-full px-4 py-2 text-xs font-semibold">
            {busy ? 'Saving…' : 'Save roles'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ConfirmModal({ msg, onCancel, onOk }: { msg: string; onCancel: () => void; onOk: () => void }) {
  const [txt, setTxt] = useState('')
  return (
    <Modal title="Confirm action" onClose={onCancel}>
      <p className="text-sm">{msg}</p>
      <p className="mt-3 text-xs text-[var(--ink-soft)]">Type <span className="font-mono font-bold">CONFIRM</span> to proceed:</p>
      <input className="input-lux mt-2" value={txt} onChange={(e) => setTxt(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="btn-outline-gold rounded-full px-4 py-2 text-xs font-semibold">Cancel</button>
        <button disabled={txt !== 'CONFIRM'} onClick={onOk} className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-40">Confirm</button>
      </div>
    </Modal>
  )
}