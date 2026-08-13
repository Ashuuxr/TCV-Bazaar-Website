# TCV Bazaar Admin Authentication Report

## Executive summary

A production Supabase Auth–based Admin Authentication system has been implemented in the existing TCV Bazaar Website. The implementation preserves the existing Supabase project, profiles, multi-role authorization model, admin UI, server functions, and public website design. No separate authentication backend was created, and no production data was deleted.

The changes were merged into `main` through [Pull Request #4](https://github.com/Ashuuxr/TCV-Bazaar-Website/pull/4). Vercel deployed the merged build successfully, and the live admin flow was tested with the existing admin account.

## Authentication system

The application uses Supabase Auth email/password authentication through `supabase.auth.signInWithPassword`. Passwords are never stored manually, placed in localStorage, or embedded in frontend code. Supabase Auth remains responsible for password hashing, credential verification, session persistence, token refresh, and logout.

The admin login page is available at:

> https://tcv-bazaar-website-ez.vercel.app/admin/login

The page now provides email validation, password validation, show/hide password, remember-session preference, loading and disabled-button states, accessible labels, clear authentication errors, and the existing forgot-password entry point.

The forgot-password flow continues to use `supabase.auth.resetPasswordForEmail`, a redirect to `/admin/reset-password`, recovery-session detection, and `supabase.auth.updateUser`. Password reset validation now requires at least 12 characters containing uppercase, lowercase, a number, and a symbol.

## Admin authorization

The existing authoritative role model was preserved. The live Supabase project already contains a profile linked to the Auth user ID and a `user_roles` table. The existing admin account `ashuuxxr@gmail.com` is active, marked as the owner, and has both `admin` and `super_admin` roles.

After successful Supabase authentication, the client calls the existing server function `getMyRoles`. Access is granted only when the returned role set contains `admin` or `super_admin`. Authenticated users without either role are signed out from the login flow and shown an access-denied state in the admin layout.

The admin layout verifies the session and role before rendering any nested admin route. Unauthenticated visitors are redirected to `/admin/login`. Authenticated non-admin users receive an `Access denied` response and cannot render admin child routes. Admin server functions continue to enforce authorization independently, so frontend navigation cannot bypass server-side checks.

## Protected routes and server actions

The existing `/admin` route tree and all nested `/admin/*` pages are protected by the admin layout gate. The protected surface includes the dashboard, analytics, reports, CMS, media, theme, logos, hero, gallery, videos, brochures, SEO, events, packages, stalls, bookings, customers, payments, invoices, banks, templates, version history, users, audit log, company, tracking, and settings pages.

Existing server functions continue to require a valid Supabase bearer session. Role-sensitive handlers use the existing `user_roles` model and server-side role checks before accessing service-role operations. A missing authorization check was added to `restoreVersion`, preventing authenticated non-admin users from restoring site-content versions.

## Supabase schema and RLS

No duplicate profile or role table was created. The existing Supabase schema was inspected and preserved:

| Existing object | Purpose | Result |
|---|---|---|
| `profiles` | Auth-linked profile data, status, and ownership | Reused unchanged by this feature |
| `user_roles` | Multi-role authorization | Reused; existing admin and super-admin roles preserved |
| `app_role` | `admin`, `super_admin`, `manager`, `editor`, and other application roles | Reused |
| `has_role` / `has_any_role` | Database-level role checks used by RLS | Preserved and previously hardened |
| `user_audit_log` | Administrative audit trail | Preserved and used by existing admin operations |

RLS was not disabled. Existing RLS policies and the previously applied role-check hardening migration remain authoritative. The existing service-role client is server-only and is not imported into browser code.

## Security fixes

The implementation fixes or verifies the following security concerns:

| Area | Result |
|---|---|
| Hardcoded frontend admin password | Removed from the client-side CMS store and admin settings UI |
| Password storage | Supabase Auth only; no manual password storage |
| Service-role key | Remains server-only; no `VITE_` service-role variable is used |
| Admin role trust | Role is fetched through an authenticated server function and enforced by server/database logic |
| Direct `/admin` access | Redirects unauthenticated users to `/admin/login` |
| Non-admin access | Shows access denied and prevents nested admin rendering |
| Version restoration | Added missing server-side admin-role check |
| Password reset | Uses Supabase recovery sessions and stronger password validation |
| Session logout | Live-tested; reopening `/admin` after logout returns to `/admin/login` |

## Optional two-factor authentication

TOTP 2FA was not enabled in this change. The existing application does not currently contain a complete MFA enrollment, challenge, recovery-code, and AAL2 verification surface. A safe implementation would require enabling Supabase Auth MFA configuration, adding an admin-only enrollment flow, verifying the challenge before privileged access, and adding recovery handling. No fake or custom 2FA mechanism was introduced.

## Environment variables

The browser requires these public variables:

```env
VITE_SUPABASE_URL=https://drmqujjazvxcubsizmlw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Server-side Supabase operations require:

```env
SUPABASE_URL=https://drmqujjazvxcubsizmlw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `VITE_`, included in client code, or committed to the repository. Vercel Production and Preview already contain the required browser-facing publishable-key configuration.

## Changed files

The final authentication commit is `f5bb633` (`implement secure admin authentication flow`). The changed files are:

| File | Change |
|---|---|
| `src/screens/admin/Login.tsx` | Role-aware Supabase login, validation, password visibility, remember-session preference, and accessible form fields |
| `src/screens/admin/Layout.tsx` | Session and admin-role gate with access-denied state before nested admin rendering |
| `src/screens/admin/ResetPassword.tsx` | Strong password validation, visibility controls, and accessible recovery fields |
| `src/lib/versionHistory.functions.ts` | Server-side admin authorization for version restoration |

## Validation and production verification

The following checks passed locally:

| Check | Result |
|---|---|
| TypeScript compiler | Passed with `tsc --noEmit` |
| Vite production build | Passed |
| Pull Request checks | Passed |
| Vercel Preview deployment | Ready |
| Vercel Production deployment | Ready |
| Unauthenticated `/admin` access | Redirected to `/admin/login` |
| Successful admin login | Passed with the existing admin account |
| Admin dashboard rendering | Passed |
| Admin navigation and server-backed dashboard data | Passed |
| Logout | Passed |
| Access after logout | Redirected back to `/admin/login` |
| Forgot-password entry point | Present and reachable |

## Deployment

The implementation was merged through [Pull Request #4](https://github.com/Ashuuxr/TCV-Bazaar-Website/pull/4). The production site is:

> https://tcv-bazaar-website-ez.vercel.app/

The production admin login URL is:

> https://tcv-bazaar-website-ez.vercel.app/admin/login

## Remaining manual steps

The existing admin account is already present and active, so no new admin account was created. If the owner wants TOTP 2FA, Supabase Auth MFA must first be enabled and a dedicated enrollment/challenge/recovery UI should be added. The existing admin password should also be rotated if it was ever shared outside Supabase Auth or used in an earlier hardcoded configuration.
