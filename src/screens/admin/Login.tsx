import { useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase } from '@/integrations/supabase/client'
import { useCms } from '@/lib/store'
import { getMyRoles } from '@/lib/users.functions'

export default function AdminLogin() {
  const log = useCms((s) => s.log)
  const nav = useNavigate()
  const [stage, setStage] = useState<'login' | 'forgot' | 'verify'>('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setInfo('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErr('Enter a valid email address.')
      return
    }
    if (!pass) {
      setErr('Enter your password.')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pass,
      })
      if (error) {
        setErr(error.message === 'Invalid login credentials'
          ? 'Invalid email or password.'
          : error.message)
        return
      }
      const access = await getMyRoles()
      const isAdmin = access.roles.includes('admin') || access.roles.includes('super_admin')
      if (!isAdmin) {
        await supabase.auth.signOut()
        setErr('This account is authenticated but is not authorized for the Admin Console.')
        return
      }
      if (!remember) {
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith('sb-')) window.localStorage.removeItem(key)
        }
        setInfo('Signed in for this browser session. This session will end when the tab is refreshed or closed.')
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
      setInfo(`If an admin account exists for ${target}, a 6-digit recovery code has been emailed. Check your inbox (and spam).`)
      setOtp('')
      setStage('verify')
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
                  <label htmlFor="admin-email" className="label-lux">Email</label>
                <div className="relative"><Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                  <input id="admin-email" name="email" type="email" autoComplete="email" required className="input-lux pl-11" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
              </div>
              <div>
                  <label htmlFor="admin-password" className="label-lux">Password</label>
                <div className="relative"><Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                  <input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="input-lux pl-11 pr-12" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-gold">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button></div>
                <label className="mt-2 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Keep me signed in on this device
                </label>
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
              <p className="text-sm text-[var(--ink-soft)]">Enter your admin email — we'll send a 6-digit recovery code to your inbox.</p>
              <div><label htmlFor="reset-email" className="label-lux">Admin Email</label><input id="reset-email" name="email" type="email" autoComplete="email" required className="input-lux" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
              {err && <p className="text-xs font-medium text-red-500">{err}</p>}
              {info && <p className="text-xs font-medium text-emerald-500">{info}</p>}
              <button disabled={busy} type="submit" className="btn-gold w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Sending…' : 'Send Recovery Code'}</button>
              <button type="button" onClick={() => { setErr(''); setInfo(''); setStage('login') }} className="w-full text-center text-xs font-semibold text-[var(--ink-soft)] hover:text-gold">← Back to sign in</button>
            </form>
          )}
          {stage === 'verify' && (
            <form onSubmit={async (e) => {
              e.preventDefault()
              setErr(''); setInfo('')
              const target = forgotEmail.trim().toLowerCase()
              if (!/^\d{6}$/.test(otp.trim())) {
                setErr('Enter the 6-digit code from your email.')
                return
              }
              setBusy(true)
              try {
                const { error } = await supabase.auth.verifyOtp({ email: target, token: otp.trim(), type: 'recovery' })
                if (error) {
                  setErr('That code is invalid or expired. Request a new code and try again.')
                  return
                }
                nav('/admin/reset-password')
              } catch (e: any) {
                setErr(e?.message ?? 'Could not verify the recovery code.')
              } finally {
                setBusy(false)
              }
            }} className="space-y-5">
              <h1 className="font-display text-2xl font-medium">Verify recovery code</h1>
              <p className="text-sm text-[var(--ink-soft)]">Enter the 6-digit code sent to <strong>{forgotEmail}</strong>. The code expires according to your Supabase Auth email-OTP settings.</p>
              <div><label htmlFor="recovery-otp" className="label-lux">Email code</label><input id="recovery-otp" name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className="input-lux tracking-[0.35em]" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" /></div>
              {err && <p className="text-xs font-medium text-red-500">{err}</p>}
              {info && <p className="text-xs font-medium text-emerald-500">{info}</p>}
              <button disabled={busy} type="submit" className="btn-gold w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Verifying…' : 'Verify Code'}</button>
              <button type="button" disabled={busy} onClick={() => { setErr(''); setInfo(''); setStage('forgot') }} className="w-full text-center text-xs font-semibold text-[var(--ink-soft)] hover:text-gold">Resend code</button>
              <button type="button" onClick={() => { setErr(''); setInfo(''); setStage('login') }} className="w-full text-center text-xs font-semibold text-[var(--ink-soft)] hover:text-gold">← Back to sign in</button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-[var(--ink-soft)]">Protected by secure sessions & audit logs.</p>
      </div>
    </div>
  )
}
