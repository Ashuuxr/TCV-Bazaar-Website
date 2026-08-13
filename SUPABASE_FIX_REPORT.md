# TCV Bazaar Website — Supabase Integration Fix Report

## Executive Summary

The existing website was preserved. I audited the Supabase client architecture, authentication middleware, public server readers, storage upload helpers, repository migrations, and the active Supabase project. The primary causes of the reported failures were inconsistent publishable-key environment-variable names and missing storage-policy migrations in the live project. The fixes were committed and pushed to GitHub in commit [`9305dbb`](https://github.com/Ashuuxr/TCV-Bazaar-Website/commit/9305dbb).

The live Supabase project was identified as `TCV-Bazaar-Website` with project reference `drmqujjazvxcubsizmlw`. The repository's storage-policy migration was applied to that existing project; no second Supabase project was created.

## What Was Broken

The browser client correctly referenced `VITE_SUPABASE_PUBLISHABLE_KEY`, but the server authentication middleware and public server-side readers expected `SUPABASE_PUBLISHABLE_KEY`. That mismatch could produce invalid-key or missing-key behavior in server functions even when the Vite client variables were configured correctly.

The active Supabase project had migrations through `20260721164942`, but did not have the repository's `20260813000001_storage_policies.sql` migration deployed. Consequently, the `hero-videos`, `brochures`, and related storage buckets and policies were not guaranteed to match the application code. The live project also contained legacy storage policies alongside the consolidated policy set, so duplicate policy definitions were cleaned up.

The upload helper generated ten-year signed URLs for every bucket, including private files. This was unnecessarily long-lived for sensitive assets and did not distinguish intentionally public buckets from private buckets.

## Changes Implemented

| Area | Change |
|---|---|
| Browser Supabase client | Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; no service-role fallback exists. |
| Server auth middleware | Uses `SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY` to validate bearer tokens under normal RLS. |
| Public CMS reader | Uses `VITE_SUPABASE_PUBLISHABLE_KEY` instead of the obsolete `SUPABASE_PUBLISHABLE_KEY`. |
| Public stalls reader | Uses `VITE_SUPABASE_PUBLISHABLE_KEY` instead of the obsolete `SUPABASE_PUBLISHABLE_KEY`. |
| Storage URL handling | Public buckets now use stable public URLs; private buckets use one-hour signed URLs. |
| Server-only privileges | `SUPABASE_SERVICE_ROLE_KEY` remains confined to `client.server.ts` and dynamically imported server-only operations. |
| Storage migration | Applied the repository storage migration to the existing Supabase project. |
| Duplicate policies | Removed legacy colon-named storage policies and recorded the cleanup migration in `20260813000003_remove_legacy_storage_policies.sql`. |

## Storage Policies and Buckets

The live project now contains the expected buckets. Public read access is retained only for the intended public buckets, while writes remain authenticated and admin-authorized through `public.has_role(auth.uid(), 'admin')`.

| Bucket group | Buckets | Access model |
|---|---|---|
| Public assets | `brand-assets`, `gallery`, `page-assets`, `hero-videos`, `brochures` | Public reads; authenticated admin inserts, updates, and deletes. |
| Private admin assets | `media-library`, `company-assets`, `bank-qr` | Authenticated reads; authenticated admin inserts, updates, and deletes. |
| User payment evidence | `payment-screenshots` | Authenticated users may insert; owners or admins may read; admins may update or delete. |

The live policy verification confirmed the canonical `storage_*` policies for hero videos, brochures, and the other configured buckets. RLS was not disabled, and storage inserts were not made public.

## Files Changed

| File | Purpose |
|---|---|
| `src/integrations/supabase/client.ts` | Corrected client environment-variable usage and diagnostics. |
| `src/integrations/supabase/auth-middleware.ts` | Corrected server bearer-token validation environment-variable usage. |
| `src/lib/siteContent.functions.ts` | Corrected public CMS reader key lookup. |
| `src/lib/stallsPublic.functions.ts` | Corrected public stalls reader key lookup. |
| `src/lib/uploads.ts` | Separated public URLs from short-lived private signed URLs. |
| `supabase/migrations/20260813000003_remove_legacy_storage_policies.sql` | Records the duplicate-policy cleanup for future deployments. |

## Vercel Environment Variables

Configure these variables in the Vercel project. The two `VITE_*` variables are exposed to the browser by design and must contain only the Supabase URL and publishable key. The service-role key must never be prefixed with `VITE_`.

| Variable | Required scope | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Production, Preview, Development | `https://drmqujjazvxcubsizmlw.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | The active Supabase publishable key. |
| `SUPABASE_URL` | Server runtime | `https://drmqujjazvxcubsizmlw.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server runtime only | The active Supabase service-role key. |
| `SITE_URL` | Server runtime | The actual deployed Vercel production URL. |

Do not configure `VITE_SUPABASE_SERVICE_ROLE_KEY`, and do not commit any `.env` file containing secrets. `SUPABASE_PUBLISHABLE_KEY` is no longer required by the corrected code; use `VITE_SUPABASE_PUBLISHABLE_KEY` consistently.

## Supabase Auth Redirect Configuration

The actual Vercel deployment domain was not present in the repository, so it was not invented. In Supabase Authentication settings, add the exact production URL as the Site URL and add the following redirect URL after substituting the real Vercel domain:

```text
https://YOUR-ACTUAL-VERCEL-DOMAIN/admin/reset-password
```

If Vercel preview deployments need password-reset support, add the exact preview URL pattern permitted by the deployment setup. If OAuth providers are enabled later, add the provider callback URL generated by the application rather than guessing one.

## Validation Performed

The direct TypeScript compiler completed successfully with no diagnostics. The direct Vite production build completed successfully. The ordinary package scripts were blocked by the sandbox's package-manager lifecycle policy requiring approval for the `core-js` build script; this is an environment limitation, not a TypeScript or Vite compilation failure.

The live Supabase project was queried before and after the migration. The storage buckets were verified, the canonical storage policies were verified, and the legacy duplicate policies were removed. A real browser upload with a user-selected MP4 was not executed because no authenticated admin browser session or test credential was provided. The code path and database policy path are now aligned for that test.

## Local Test Commands

From the repository root, install dependencies using the project's normal package-manager workflow, then run:

```bash
npm run typecheck
npm run build
npm run dev
```

With a configured authenticated admin session, verify hero-video upload, replacement, deletion, brochure upload, gallery upload, private asset access, payment-screenshot ownership, login, logout, password reset, and protected-route redirects.

## Redeploy Steps

1. In Vercel, configure the five variables listed above with the correct Production, Preview, and Development scopes.
2. In Supabase Authentication settings, set the actual production Site URL and add the exact password-reset redirect URL.
3. Deploy commit `9305dbb` from the `main` branch.
4. After deployment, verify the browser console does not contain an invalid-key error.
5. Sign in as an admin and test hero-video upload and replacement first, followed by brochure and other media operations.
6. Test password reset from the production domain and confirm that the redirect returns to `/admin/reset-password`.

## Remaining Issues and Limits

The repository does not contain the actual Vercel deployment domain, so the production Site URL and redirect URL still require the deployment owner to enter the real domain. Browser-level end-to-end tests requiring an authenticated account were not run in this audit. The migration file named `20260813000002_add_finance_role.sql` contains only `COMMIT;` and was not applied because it does not define a valid standalone change; it should be reviewed separately if a finance role is still required.

## References

[1]: https://github.com/Ashuuxr/TCV-Bazaar-Website/commit/9305dbb "TCV Bazaar Website Supabase integration fixes"
[2]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Storage access control"
[3]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Auth redirect URLs"
