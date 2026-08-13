# Supabase Recovery OTP Setup

The admin forgot-password UI now requests a recovery email, verifies a six-digit code with `supabase.auth.verifyOtp({ email, token, type: 'recovery' })`, and then allows the user to set a new password through Supabase Auth.

To make Supabase send the numeric code, open the existing Supabase project dashboard and go to **Authentication → Email Templates → Reset Password**. Use the project’s existing branding and replace the reset-link-only body with a template that includes the recovery token variable:

```html
<h2>Reset your TCV Bazaar password</h2>
<p>Use this one-time recovery code to continue:</p>
<p style="font-size: 28px; font-weight: 700; letter-spacing: 8px;">{{ .Token }}</p>
<p>This code expires according to the project’s Auth email-OTP expiration setting. If you did not request a password reset, you can ignore this email.</p>
```

The code must use `{{ .Token }}` so the user receives the six-digit OTP. Do not expose service-role credentials in the template or add custom password storage. The existing redirect URL `/admin/reset-password` should remain configured in **Authentication → URL Configuration → Redirect URLs** for the fallback recovery-session flow.

After saving the template, request a recovery code from:

> https://tcv-bazaar-website-ez.vercel.app/admin/login

Choose **Forgot password?**, enter the admin email, enter the six-digit email code, and set a new password. Production SMTP should be configured for reliable delivery; Supabase’s default email service is rate-limited and intended for testing.
