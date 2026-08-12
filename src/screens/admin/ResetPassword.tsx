import { useEffect, useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { Lock, ShieldCheck } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase } from '@/integrations/supabase/client'
import { useCms } from '@/lib/store'

export default function AdminResetPassword() {
  const nav = useNavigate()
  const log = useCms((s) => s.log)
  const [ready, setReady] = useState(false)
  const [valid, setValid] = useState(false)
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and emits
    // PASSWORD_RECOVERY on load. If a session is present (recovery token
    // exchanged), the reset form is unlocked.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setValid(true)
        setReady(true)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValid(true)
      setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setInfo('')
    if (pass.length < 8) { setErr('Password must be at least 8 characters.'); return }
    if (pass !== confirm) { setErr('Passwords do not match.'); return }
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pass })
      if (error) { setErr(error.message); return }
      log('Admin password reset via email link')
      setInfo('Password updated. Redirecting to sign-in…')
      await supabase.auth.signOut()
      setTimeout(() => nav('/admin/login'), 1200)
    } catch (e: any) {
      setErr(e?.message ?? 'Could not update password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Logo className="h-16" />
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            <ShieldCheck size={14} /> Reset Password
          </div>
        </div>
        <div className="card-lux p-8">
          {!ready && <p className="text-sm text-[var(--ink-soft)]">Verifying reset link…</p>}
          {ready && !valid && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-medium">Link expired</h1>
              <p className="text-sm text-[var(--ink-soft)]">This password reset link is invalid or has expired. Please request a new one.</p>
              <button onClick={() => nav('/admin/login')} className="btn-gold w-full rounded-full py-3.5 text-sm font-semibold">Back to sign in</button>
            </div>
          )}
          {ready && valid && (
            <form onSubmit={submit} className="space-y-5">
              <h1 className="font-display text-2xl font-medium">Choose a new password</h1>
              <div>
                <label className="label-lux">New Password</label>
                <div className="relative"><Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                  <input type="password" required className="input-lux pl-11" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="At least 8 characters" /></div>
              </div>
              <div>
                <label className="label-lux">Confirm Password</label>
                <div className="relative"><Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                  <input type="password" required className="input-lux pl-11" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" /></div>
              </div>
              {err && <p className="text-xs font-medium text-red-500">{err}</p>}
              {info && <p className="text-xs font-medium text-emerald-500">{info}</p>}
              <button disabled={busy} className="btn-gold w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Updating…' : 'Update Password'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}