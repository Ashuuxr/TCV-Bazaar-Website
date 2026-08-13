import { KeyRound, ShieldCheck, Smartphone, Users } from 'lucide-react'
import { ACard, Field, SaveBar, useDraft } from './ui'
import { useCms } from '@/lib/store'

export default function Settings() {
  const { draft, setDraft, save, dirty } = useDraft('admin')
  const activity = useCms((s) => s.activity)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Settings & Security</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Admin credentials, two-factor security, sessions and audit logs.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ACard title="Admin login" sub="Email + password for this dashboard">
          <div className="space-y-5">
            <Field label="Admin Email"><input type="email" className="input-lux" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value } as never)} /></Field>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-4 text-xs leading-relaxed text-[var(--ink-soft)]">
              Passwords are managed securely by Supabase Auth and are never stored in the browser CMS state. Use the password-reset flow from the admin login screen to change the password.
            </div>
            <button onClick={() => setDraft({ ...draft, twoFactor: !draft.twoFactor } as never)}
              className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold ${draft.twoFactor ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)]'}`}>
              <Smartphone size={14} /> Email OTP 2FA {draft.twoFactor ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </ACard>

        <ACard title="Roles & sessions">
          <div className="space-y-3 text-sm">
            {[
              { icon: ShieldCheck, t: 'Super Admin', d: draft.email, badge: 'You' },
              { icon: Users, t: 'Manager', d: 'Bookings & payments only', badge: 'Invite' },
              { icon: KeyRound, t: 'Content Editor', d: 'CMS, gallery & media only', badge: 'Invite' },
            ].map((r) => (
              <div key={r.t} className="flex items-center justify-between rounded-2xl border border-[var(--line)] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><r.icon size={16} /></span>
                  <div><div className="text-sm font-semibold">{r.t}</div><div className="text-xs text-[var(--ink-soft)]">{r.d}</div></div>
                </div>
                <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[10px] font-bold text-gold">{r.badge}</span>
              </div>
            ))}
            <p className="rounded-xl bg-[var(--bg-soft)] p-4 text-xs text-[var(--ink-soft)]">Active session: this browser · sign-out clears the session instantly. All sign-ins are recorded in the audit log.</p>
          </div>
        </ACard>
      </div>

      <ACard title="Audit log" sub="Immutable trail of the last 60 admin actions">
        <div className="max-h-72 space-y-2 overflow-y-auto text-xs">
          {activity.length === 0 && <p className="py-6 text-center text-[var(--ink-soft)]">No activity yet.</p>}
          {activity.map((a) => (
            <div key={a.id} className="flex justify-between gap-4 border-b border-[var(--line)] pb-2">
              <span>{a.text}</span>
              <span className="shrink-0 text-[var(--ink-soft)]">{new Date(a.at).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </ACard>
      <SaveBar dirty={dirty} onSave={save} />
    </div>
  )
}
