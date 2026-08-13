# TCV Bazaar Complete End-to-End Audit

## Scope

The audit covered the GitHub repository, TanStack Start SSR/client boundaries, Supabase clients and server functions, public and admin routes, storage helpers, authentication flow, CMS persistence, database schema and policies, Supabase advisors, local TypeScript/build validation, and the deployed Vercel production domain.

## Findings and fixes

| Priority | Finding | Action |
|---|---|---|
| Critical | A real admin password was hard-coded in the client-side Zustand store and persisted state. | Removed the password from the client bundle and browser state. Admin password management now belongs to Supabase Auth; persisted state migration version 8 removes the legacy field. Rotate the exposed password if it was ever used in production. |
| High | Browser Supabase client had a server-variable fallback for the URL. | Browser code now reads only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; service-role variables remain server-only. |
| High | Role-check SECURITY DEFINER RPCs accepted arbitrary user IDs from authenticated callers. | Added and applied migration `20260813000004_harden_role_check_functions.sql`, restricting role/billing checks to the authenticated caller identity while preserving RLS-required execution. |
| Medium | Dynamic FAQ text was embedded in JSON-LD without closing-tag escaping. | Escaped `<`, `>`, and `&` before embedding CMS-controlled FAQ data into the structured-data script. |
| Medium | Admin settings exposed a client-side password editor that did not correspond to Supabase Auth. | Replaced it with a clear Supabase Auth password-management message. |
| Low | Environment requirements were not represented by a safe local template. | Added `.env.example` with public and server-only variable names and explicit no-secret guidance. |
| Medium | Production domain currently renders the generic TanStack error screen. | The HTTP response is 200 and returns the app shell, but the live production deployment is still on the older `main` deployment. The corrected PR preview builds successfully; production must be updated by merging the PR or deploying the corrected branch. |

## Supabase changes

The existing project `drmqujjazvxcubsizmlw` was inspected without deleting production data. The live schema contains the application tables, relationships, indexes, RLS, storage buckets, and RPCs required by the repository. The storage-policy migrations previously applied remain in place. The new role-check hardening migration was applied successfully to the live project.

Supabase advisors still report performance warnings for multiple permissive policies. These are generally intentional OR-combinations of user and admin access rules; consolidating them would be a separate policy refactor and was not performed because it could change authorization semantics. Auth leaked-password protection is still disabled in the Supabase project and should be enabled from the Supabase Auth settings.

## Validation

The final local checks passed:

- TypeScript: `tsc --noEmit` passed.
- Production build: Vite build passed.
- Git diff validation: `git diff --check` passed.
- Credential scan: the exposed password is absent from current source files.

The repository’s existing ESLint configuration reports thousands of Prettier-formatting violations across legacy files. These are baseline formatting issues rather than new type or build failures; no whole-repository formatting rewrite was made to avoid unnecessary UI churn.

## Required environment variables

| Scope | Variables |
|---|---|
| Browser / Vercel Production, Preview, Development | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Server runtime only | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Never configure or expose `VITE_SUPABASE_SERVICE_ROLE_KEY`. If the hard-coded password was real, change it in Supabase Auth immediately.

## GitHub and Vercel status

The fixes are prepared on the existing PR branch `fix/supabase-integration`. The latest branch changes include the credential removal, client boundary correction, FAQ JSON-LD hardening, environment template, and Supabase migration. The corrected branch previously produced a successful Vercel Preview deployment with status **Ready Latest**.

The remaining production step is to merge [Pull Request #2](https://github.com/Ashuuxr/TCV-Bazaar-Website/pull/2) into `main`, or manually promote the corrected preview deployment. This action is intentionally left for the repository owner because it changes the production deployment. After promotion, verify the production URL `https://tcv-bazaar-website-ez.vercel.app/` and test the public pages, `/book`, `/stall-layout`, `/admin/login`, Supabase Auth, and admin storage uploads.
