# Raghav Sharma OS — deployment setup

This project keeps the existing Next.js/Supabase portfolio and replaces the `/` command center with a ProzillaOS-inspired desktop.

## What changed

- Linux-style boot screen: `RAGHAV SHARMA`
- Portfolio sections are desktop folders
- Existing pages/routes remain in the project
- Terminal remains available from the dock
- Music player is now a toolbar/dock application
- Existing local music in `public/music/` is used by the player
- ProzillaOS games are available through the **Games** folder and open the official ProzillaOS environment
- Existing admin, API, Supabase and security routes are preserved

## Before deployment

Create `.env.local` locally or add the same variables in Vercel. Do not commit `.env` or `.env.local`.

At minimum, use the variables already required by the existing project, including the Supabase and site URL variables documented by the existing codebase.

Typical deployment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_ALLOWED_EMAIL=
NEXT_PUBLIC_SITE_URL=https://sharma-raghav.com
```

Only expose variables beginning with `NEXT_PUBLIC_` to browser code. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side.

## Local verification

```bash
npm ci
npm run typecheck
npm run build
npm run start
```

Then open `/` and verify:

1. Boot screen appears.
2. Desktop folders open on double click.
3. Music button opens the player and local tracks play.
4. Games folder opens ProzillaOS.
5. Existing routes such as `/research`, `/engineering`, `/security-lab`, `/adminrs`, and API routes still work.

## Git

```bash
git add .
git commit -m "feat: turn portfolio into Raghav Sharma OS"
git push
```
