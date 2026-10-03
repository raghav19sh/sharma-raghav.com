# Sharma-Raghav OS

Phase 2 deliverable — real Next.js/TypeScript/Supabase scaffold. See
`SHARMA-RAGHAV-OS-PLAN.md` (delivered alongside this repo) for the full
architecture rationale and audit.

## What's real here vs. what's still yours to do

This repo type-checks and is structurally complete for the routes it
covers, but **it has never been run against a live database** — I have no
network access to install `next`/`@supabase/*`/`zod` or spin up Postgres in
my environment. You are the first real build/run of this code. Budget time
for that.

## Setup

1. **Create a Supabase project** at supabase.com.
2. **Run the migration**: `supabase/migrations/0001_init.sql` in the SQL editor, or via the Supabase CLI.
3. **Copy `.env.example` to `.env.local`** and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project settings.
   - `SUPABASE_SERVICE_ROLE_KEY` — same place; **server-only**, never expose this.
   - `ADMIN_ALLOWED_EMAIL` — the one email allowed into `/admin`.
   - `AUTH_SECRET` — any long random string.
4. **Create your admin user** in Supabase Auth (dashboard → Authentication → Users → Add user) with the same email as `ADMIN_ALLOWED_EMAIL`.
5. `npm install`
6. `npm run seed` — loads only the resume-verified data (2 projects, 2 certifications, education/experience timeline). See `scripts/seed.ts` for exactly what is and isn't seeded, and why.
7. `npm run dev`

## Before you trust this in production

Run these yourself — I could not run them in my environment:

```
npm run typecheck
npm run lint
npm run build
```

Fix whatever surfaces. I did what validation I could without the real
packages installed (see below), but that is not a substitute for a real
build.

## What I actually validated, and how

- **Syntax, all 84 TypeScript/TSX files**: parsed with esbuild's TS/JSX
  parser. Zero errors. This catches malformed code — unclosed braces, bad
  JSX, typos in syntax — but not type or logic errors.
- **Types, whole repo, strict mode**: `next`, `@supabase/ssr`,
  `@supabase/supabase-js`, `zod`, `react`, and `lucide-react` aren't
  installed in my sandbox (no network access to fetch them), so I wrote
  minimal ambient type shims for their public surface and ran the real
  TypeScript compiler against the actual repo with `strict: true`,
  matching `tsconfig.json`. Zero errors.
- **The honest limit of that check**: the shims type Supabase query
  results and Zod schemas loosely (close to `any`), so this pass proves
  the app's own logic and component/prop shapes are internally consistent
  — it does *not* prove correctness against Supabase's real generated
  types or Zod's real inference. `npm run typecheck` after `npm install`
  is the real gate; run it before trusting this.
- Neither check touched a database, so RLS behavior, query correctness at
  runtime, and the auth flow are unverified until you run this against a
  real Supabase project.

## Known gaps, called out rather than hidden

- **AI Terminal Layer 3** (an actual AI assistant with scoped DB tool
  access) is not implemented — the terminal currently does real navigation
  (Layer 1) and real hand-written query patterns (Layer 2), and says so
  explicitly when it can't answer something. See §14 in the plan.
- **SOC OS** deliberately does not expose a public alert feed — flagged as
  a disagreement with a literal reading of the routing spec, not a silent
  decision. See the comment in `src/app/soc/page.tsx`.
- **RLS policies** are written for every table but not exhaustively
  tested against real requests (can't, without a live project). Test the
  public/private boundary yourself before trusting it.
- **Full admin CRUD** now exists for research, projects, articles, and
  journal (the four "slug content" tables, sharing `src/lib/admin/
  contentHelpers.ts`). Books, courses, media, and snippets still only have
  public list pages and direct Supabase table access for admin edits — no
  dedicated admin UI yet. Same pattern would extend cleanly; just not done.
- **Tags and related content** (§18) are real — `tags`/`taggables` tables,
  a real "related by shared tag" query, and a working tag input — but only
  wired end-to-end for Research as the reference implementation. The other
  three content types have the display code but not yet a tag input in
  their admin forms.
- **Activity events** (§17) write for real on publish/update of any public
  content, and Command Center reads them for real. No UI yet to browse the
  full history beyond the last 6 shown on Command Center.
- **`public-api` docs page** lists only the endpoints actually built in
  this scaffold. Extend both together, not the docs alone.
