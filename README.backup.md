# TCV Bazaar — Project Backup

This archive is a full snapshot of the TCV Bazaar platform (TanStack Start + React 19 + Vite 7 + Tailwind v4 + Supabase). It is intended for restore, migration to another host, or long-term backup. No source files were modified when producing this archive.

## Contents

- `src/` — application source (routes, screens, components, lib, hooks, integrations, layouts, styles)
- `supabase/` — `config.toml` + full `migrations/` history (28 SQL migrations, ordered)
- `public/` — static assets served as-is
- `package.json`, `bun.lock` — dependencies and locked versions
- `vite.config.ts`, `tsconfig.json`, `components.json`, `eslint.config.js`, `.prettierrc`, `bunfig.toml` — build/lint/format config
- `.env.example` — environment variable template (no secrets)

What is intentionally NOT in the archive:
- `.env` with real secrets
- `node_modules/`, `dist/`, `.vite/`, `.tanstack/`, `tsconfig.tsbuildinfo` (build outputs / caches)
- `.git/` internal state

## Restore & run locally

Prerequisites: Bun ≥ 1.1 (or Node ≥ 20 + npm), a Supabase project.

```bash
unzip tcv-bazaar-backup-*.zip -d tcv-bazaar
cd tcv-bazaar
cp .env.example .env    # then fill in the real values
bun install             # or: npm install
bun run dev             # starts Vite on http://localhost:8080
```

## Restore the database

Point the Supabase CLI at a fresh project and apply the migrations in order:

```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase db push        # applies every file in supabase/migrations in timestamp order
```

Storage buckets used by the app (create them in the target project if not already present, matching the settings from `supabase/config.toml` and the migrations):
- `payment-screenshots` (private)
- `booking-pdfs` (private)
- `company-assets` (private — read restricted to admin/billing)
- `brochures` (private)

Bootstrap the first Super Admin: sign up in the app, then run the migration path that promotes the desired email to `super_admin` (see the migration that seeds `ashuuxxr@gmail.com`, or adapt it).

## Build & deploy

```bash
bun run build           # produces the production bundle
bun run start           # serves the built app
```

The app targets an edge runtime (Cloudflare Workers). Any host that supports TanStack Start's Nitro output will work; follow the target host's docs to deploy `.output/`.

## Environment variables

See `.env.example`. `VITE_*` values are exposed to the browser; the rest are server-only. Never commit real values.

## Notes

- No functional changes were made to produce this backup — every route, server function, migration, and asset is exactly as it was at export time.
- Realtime, RLS policies, GRANTs, triggers and SECURITY DEFINER functions are all captured in the migrations directory.