# CAILS Institutional Portal

Web frontend for the CAILS Integrated HR, Academic Administration, Workflow
& Internal Communication Management System.

## Stack
- Next.js 16 (App Router, TypeScript, Tailwind v4)
- Supabase (Auth + Postgres + RLS) — project `jdoqqkbeativsohyvtsi`

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase URL + publishable key
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to /login.

## Creating your first account

Sign up a user via Supabase Auth (dashboard, or a signup form once built).
A `profiles` row is created automatically by a database trigger. To see
the full dashboard (not the "no office assigned" empty state), a System
Administrator must insert a row into `user_roles` linking that user to a
role (e.g. `SYSTEM_ADMIN`) — this can only be done by someone who already
holds `MANAGE_USERS`, so the very first admin account should be assigned
directly in the Supabase SQL editor:

```sql
insert into user_roles (user_id, role_id, scope_type)
select '<the new user''s auth.users id>', id, 'institution'
from roles where code = 'SYSTEM_ADMIN';
```

## Deploying

Push this repo to GitHub and import it into Vercel, adding the two
environment variables from `.env.local`. On Vercel you also have normal
internet access, so you can switch the fonts in `layout.tsx` /
`globals.css` back to `next/font/google` (Fraunces + Inter) if desired —
the sandbox this was built in couldn't reach fonts.googleapis.com, so it
currently uses system font stacks instead.

## Project structure

- `src/app/(dashboard)/` — authenticated shell (sidebar, header) + pages
- `src/app/login/` — login page + server action
- `src/lib/supabase/` — browser/server Supabase clients + session middleware
- `src/lib/auth.ts` — loads the signed-in user's profile + role codes
- `src/lib/nav-config.ts` — role-aware sidebar navigation
- `src/proxy.ts` — Next.js 16 middleware (session refresh + route guarding)
