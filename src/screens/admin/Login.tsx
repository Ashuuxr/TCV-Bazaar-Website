import { useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { Lock, Mail, ShieldCheck } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase } from '@/integrations/supabase/client'
import { useCms } from '@/lib/store'

export default function AdminLogin() {
  const log = useCms((s) => s.log)
  const nav = useNavigate()
  const [stage, setStage] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setInfo(''); setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      })
      if (error) {
        setErr(error.message === 'Invalid login credentials'
          ? 'Invalid email or password.'
          : error.message)
        return
      }
      log('Admin signed in')
      nav('/admin')
    } catch (e: any) {
      setErr(e?.message ?? 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const sendResetLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setInfo(''); setBusy(true)
    try {
      const target = forgotEmail.trim().toLowerCase()
      const redirectTo = `${window.location.origin}/admin/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(target, { redirectTo })
      if (error) {
        setErr(error.message)
        return
      }
      setInfo(`If an admin account exists for ${target}, a password reset link has been emailed. Check your inbox (and spam).`)
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send reset email.')
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
            <ShieldCheck size={14} /> Admin Console
          </div>
        </div>
        <div className="card-lux p-8">
          {stage === 'login' && (
            <form onSubmit={doLogin} className="space-y-5">
              <h1 className="font-display text-2xl font-medium">Welcome back</h1>
              <div>
                <label className="label-lux">Email</label>
                <div className="relative"><Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                  <input type="email" required className="input-lux pl-11" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
              </div>
              <div>
                <label className="label-lux">Password</label>
                <div className="relative"><Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                  <input type="password" required className="input-lux pl-11" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" /></div>
              </div>
              {err && <p className="text-xs font-medium text-red-500">{err}</p>}
              {info && <p className="text-xs font-medium text-emerald-500">{info}</p>}
              <button disabled={busy} className="btn-gold w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Signing in…' : 'Sign In'}</button>
              <button type="button" onClick={() => { setErr(''); setInfo(''); setForgotEmail(email); setStage('forgot') }} className="w-full text-center text-xs font-semibold text-[var(--ink-soft)] hover:text-gold">Forgot password?</button>
            </form>
          )}
          {stage === 'forgot' && (
            <form onSubmit={sendResetLink} className="space-y-5">
              <h1 className="font-display text-2xl font-medium">Reset password</h1>
              <p className="text-sm text-[var(--ink-soft)]">Enter your admin email — we'll send a secure reset link to your inbox.</p>
              <div><label className="label-lux">Admin Email</label><input type="email" required className="input-lux" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
              {err && <p className="text-xs font-medium text-red-500">{err}</p>}
              {info && <p className="text-xs font-medium text-emerald-500">{info}</p>}
              <button disabled={busy} type="submit" className="btn-gold w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Sending…' : 'Send Reset Link'}</button>
              <button type="button" onClick={() => { setErr(''); setInfo(''); setStage('login') }} className="w-full text-center text-xs font-semibold text-[var(--ink-soft)] hover:text-gold">← Back to sign in</button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-[var(--ink-soft)]">Protected by secure sessions & audit logs.</p>
      </div>
    </div>
  )
}
