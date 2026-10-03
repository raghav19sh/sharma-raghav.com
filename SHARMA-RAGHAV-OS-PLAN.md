# Sharma-Raghav OS — Implementation Plan
*Prepared against the current prototype (`App.jsx`, 2,180 lines) and the attached resume. Phase 1 (audit) is included at the end and is complete. Phases 2+ have not been started.*

---

## 1. Current Architecture

One React component, delivered as a Claude.ai artifact:

- **Everything in one file**: all page content, all UI primitives, the entire CSS design system, and the app shell live in `App.jsx`.
- **No server.** No database, no API, no auth. "Data" is JavaScript constants (`const DATA = {...}`) evaluated at render time.
- **Routing is `useState`.** `navigate(pageId)` sets a string and conditionally renders. There are no URLs.
- **Persistence: none.** Refreshing the tab resets everything to initial state. Nothing a visitor *or* "admin" does survives a reload, because there is no admin mode — the entire app is one public, unauthenticated bundle.
- **"Read-only" is a UI convention, not a security boundary.** It holds up today only because there is genuinely no write path anywhere in the code — not because a server is rejecting writes.

## 2. Current Problems

In order of how much they matter for a *real* system:

1. **Fabricated content presented as real.** This is the big one — full inventory in Phase 1 below. Nearly every number and record in the app has no basis in your resume.
2. **No server-side enforcement of anything.** §8/§11 of your brief require read-only and private-content rules to be enforced server-side. There is currently no server, so this requirement is simply unmet, not weakly met.
3. **No real routing.** No deep links, no back/forward, no refresh-persistence, no metadata, no 404 handling (unknown page IDs silently fall back to Command Center).
4. **Accessibility bug, confirmed in the code:** the hero globe's `<svg>` has `aria-hidden="true"` while containing focusable `role="link"` callouts inside it. A screen reader user cannot reach those links at all. This is the exact contradiction your §31 describes — it's real, and it's mine to fix.
5. **Simulated "live" data with no disclosure:** notification badge (hardcoded `3`), Now Playing (a real song/artist name with fake playback controls), 34 "SOC agents online," 92 "countries connected," visitor/session analytics — all static numbers styled to look live.
6. **No type safety.** Plain JSX, not TypeScript — nothing catches a shape mismatch before runtime.
7. **Not testable in any real sense.** One giant component can't be unit-tested per-module, and there's no CI.
8. **No secrets to manage yet, but also nothing stopping bad practice later** — there's no environment separation because there's no backend at all.

## 3. Proposed Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+, App Router, TypeScript | Server components by default, real routing, metadata API, route handlers |
| Styling | Tailwind + a small tokens file | Keep the existing lavender/burgundy system; stop hand-rolling one giant CSS string |
| Database | Postgres via Supabase | Managed, has RLS built in, matches your brief exactly |
| Auth | Supabase Auth, single admin allow-list | You are the only writer. No multi-tenant complexity needed |
| Storage | Supabase Storage | For media; DB stores metadata + path only |
| Search | Postgres full-text (`tsvector`) now, pgvector reserved for later | Real, no external dependency, upgradeable |
| Hosting | Vercel | Matches your brief; needs your account, not mine |
| Validation | Zod, at every API boundary | Never trust client input |

This is a genuine architecture change, not a re-skin — it requires a real Next.js repo, a real Supabase project, and real environment variables that only you can create.

## 4. Database Schema

Sixteen tables — I deliberately did not create separate `tasks`/`goals`/`open_loops` tables (your §6 warns against tables for complexity's sake); `open_loops` covers all three via a `type` column. Full DDL is in **`schema.sql`**, delivered alongside this plan. Summary:

- `profiles` — single row, tied to `auth.users`, holds display identity
- `research`, `projects`, `articles`, `journal_entries`, `books`, `courses`, `snippets`, `media` — one table per content type, each with `status`, `visibility`, `slug`, timestamps
- `timeline_events` — the platform history
- `open_loops` — unfinished work (`type`: task | goal | research | project | …)
- `tags` + `taggables` — polymorphic tagging, the substrate for the "knowledge graph" relationships in §18
- `activity_events` — user-facing "what changed" feed (§17)
- `audit_logs` — admin/security events, explicitly separate from `activity_events` per your §17

Every content table has `visibility text check (visibility in ('public','unlisted','private'))`. Public API queries filter on this column *in SQL*, not in a React branch.

## 5. Authentication Model

You are the only admin — this is a single-tenant system, so the model stays simple on purpose:

- Supabase Auth (email + password or magic link), one allow-listed email.
- `middleware.ts` checks the session on every `/admin/*` and `/api/admin/*` request and redirects/rejects if it isn't your session — enforced at the edge, before any page or handler code runs.
- RLS policies on every table: `select` allowed where `visibility = 'public'` (or `'unlisted'` when queried by exact slug) for the anonymous role; full `select/insert/update/delete` for the authenticated admin role only.
- Sessions via Supabase's secure, httpOnly cookies — no tokens in `localStorage`, no service-role key ever shipped to the browser (only `NEXT_PUBLIC_SUPABASE_URL` and the *anon* key are public; the service-role key stays server-only).
- Rate limiting on the login route; audit log entry on every login, logout, and failed attempt.

## 6. Routing Structure

```
app/
  layout.tsx                 global shell: topbar + sidebar + search + terminal trigger
  page.tsx                   Command Center
  research/page.tsx          research/[slug]/page.tsx
  engineering/page.tsx       engineering/[slug]/page.tsx
  security-lab/page.tsx      (client tools; no DB needed)
  soc/page.tsx
  knowledge/page.tsx         knowledge/[slug]/page.tsx
  journal/page.tsx           journal/[slug]/page.tsx      (visibility-filtered server-side)
  timeline/page.tsx
  reading-room/page.tsx
  learning-hub/page.tsx
  observatory/page.tsx       real telemetry only, see §9 of the audit
  media-library/page.tsx
  developer-workspace/page.tsx
  ai-terminal/page.tsx
  public-api/page.tsx        generated from the actual route handlers, not hand-written
  about/page.tsx
  settings/page.tsx          visitor UI prefs → localStorage; no DB write
  admin/
    layout.tsx                auth gate lives here
    page.tsx                  dashboard
    research/ projects/ journal/ media/ open-loops/ analytics/ audit/ settings/
  api/v1/
    research/ projects/ articles/ journal/ timeline/ status/ search/
    admin/…                   mirrors admin/, protected
  not-found.tsx
  error.tsx
```

Deep links, back/forward, and refresh all work for free once this is real Next.js routing — that's the point of this phase.

## 7. API Structure

Versioned, consistent envelope, matching your §36 exactly:

```
GET /api/v1/research        ?tag=&status=&page=&pageSize=
GET /api/v1/research/:slug
GET /api/v1/projects
GET /api/v1/articles
GET /api/v1/journal          → only visibility='public' rows, ever
GET /api/v1/timeline
GET /api/v1/search           ?q=
GET /api/v1/status           → real health check, not fake telemetry

POST/PATCH/DELETE /api/v1/admin/*   → session-gated, Zod-validated, audit-logged
```

```json
{ "data": [], "meta": { "total": 0, "page": 1, "pageSize": 20 } }
```

No endpoint is documented on `/public-api` unless it exists and is callable — the docs page will be generated from the same route table, not written by hand twice.

## 8. Migration Strategy

Here's the part that matters most: **this is not a like-for-like migration.** Cross-referencing the prototype's mock data against your resume (full detail in Phase 1 below) shows almost none of it is real. So the strategy is:

- **Seed for real** (from your resume): 2 projects (QR Phishing Simulation, Malware Analysis & Clipper Research), 2 certifications (Digital Forensics, Cloud Foundations/AWS), 1 experience entry (Business Analyst Virtual Intern, AICTE-EduSkills), education (MIT ADT University, B.Tech CSE, 2023–2027; DPS Hisar), skills grouped by your resume's own categories.
- **Do not seed** (no factual basis, currently fabricated): all 6 "research papers," all 6 "articles," all 5 journal entries, all 6 books, all 5 courses, the SOC alert log, media items, code snippets, "ThreatShield," "PromptGuard," "Nightwatch," "Cartograph," the 34 SOC agents, 92 countries, visitor/session analytics, Now Playing.
- Everything in the "do not seed" list becomes genuinely empty tables with real empty states ("Research archive is empty. Begin by publishing your first paper.") until you add real entries through Admin OS.

## 9. Security Model

- RLS as the actual enforcement layer (not a convenience — the only layer).
- Zod validation on every mutation input, server-side, regardless of what the client already checked.
- Secrets only in server-side env vars; `.env.example` ships with no real values (see §54 in your brief — file included).
- CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` set in `next.config.js`/middleware, tested against the actual pages (a copy-pasted CSP that breaks Tailwind's inline styles is worse than none).
- Every admin mutation writes an `audit_logs` row: actor, action, resource, resource id, timestamp.
- Rate limiting on `/api/*` and especially `/admin/login`.

## 10. Implementation Phases

Your 12 phases, unchanged, with an honest note on which ones I can execute versus which need your accounts/credentials:

| Phase | What it is | Who does it |
|---|---|---|
| 1. Audit | Below. | Done, this turn. |
| 2. Architecture & data model | Repo scaffold, `schema.sql`, types | I write it |
| 3. Database/auth/backend setup | *Create* the Supabase project, run migrations, set env vars | **You** — I can write every file, but I cannot click "New Project" on your behalf |
| 4. Migrate existing data | Seed script using resume-verified data only | I write the script; you run it against your DB |
| 5. Routing | Convert to App Router pages | I write it |
| 6. Admin OS | Real CRUD screens, gated | I write it |
| 7. Command Center → real data | Replace constants with queries | I write it |
| 8. Search | Postgres FTS + `/api/v1/search` | I write it |
| 9. Relationships/activity | Tags, `taggables`, `activity_events` | I write it |
| 10. Security/accessibility/perf pass | Fix the `aria-hidden` bug, headers, Lighthouse | I write/fix it |
| 11. Production testing | `npm run lint/typecheck/build`, E2E for auth+CRUD+visibility | I write tests; **you** run them against a live deploy |
| 12. Deploy | Vercel + Supabase, production env vars | **You** |

I'm stopping after Phase 1 in this response, per your §52 and §56. Say the word and I'll start Phase 2 (repo scaffold).

---

# Phase 1 — Audit (complete)

## A. Fabricated-data inventory, checked against your resume

| Currently shown | Reality per resume | Verdict |
|---|---|---|
| 6 "research papers" (Prompt Injection Vectors, Zero-Trust Architecture, RAG Hallucination, JWT Timing Attacks, Knowledge Graphs, SOC Threat Model) | Resume shows **zero** formal research papers | Fabricated — remove |
| Projects: ThreatShield, Sharma-Raghav OS, PacketLens, PromptGuard, Nightwatch, Cartograph (6 total) | Resume shows **2** real projects: *QR Phishing (Quishing) Simulation* (Jan–Feb 2026, Python/Flask/Kali/Ngrok/SET) and *Malware Analysis & Clipper Research* (Feb 2026, Python/C++/Ghidra/x64dbg/ProcMon) | 5 of 6 fabricated; Sharma-Raghav OS itself is real (it's this platform) |
| 6 articles, 5 journal entries, 6 books, 5 courses, 6 media items, 5 snippets, 6 SOC alerts | No basis in resume for any of them | All fabricated — ship empty with real empty states |
| Certifications: none currently modeled | Resume: **Digital Forensics**, **Cloud Foundations (AWS)** | Missing real data |
| Experience: none currently modeled | Resume: **Business Analyst Virtual Intern, AICTE-EduSkills (Celonis-supported)**, Apr–Jun 2025, Grade O | Missing real data |
| Education: not shown | Resume: **B.Tech CSE, MIT ADT University, 2023–2027** (current student); DPS Hisar, 10th/12th | Missing real data — also means "Raghav" is a current undergrad, which should set the tone everywhere (no invented "years of professional experience") |
| Skills shown as bare percentages (Security 90%, AI & Systems 84%, …) | Resume lists skills as **categories with tools**, no percentages, no methodology behind a number | Fabricated confidence metric — replace with evidence-based skill cards per your §29 |
| "34 SOC Agents Online," live badge | No SOC product exists | Fabricated — remove entirely, there is no SOC to monitor |
| "92 countries connected," visitor/session/page-view analytics | No analytics provider connected | Fabricated — remove or wire to a real privacy-friendly analytics provider |
| Notification badge showing "3" | No notification system exists | Fabricated — remove until real |
| Now Playing: "Interstellar Main Theme," Hans Zimmer, animated as if playing | Not real audio playback | Fabricated — remove, or replace with a real, properly licensed player |

**Net effect:** once fabricated content is removed, the honest current inventory is 2 projects, 2 certifications, 1 internship, and an in-progress CS degree. That's a legitimate, credible profile for a third-year security-focused CS student — it just needs to be *shown as itself*, not padded to look like an established platform.

## B. Architectural findings
- Confirmed: 2,180-line single file, no types, no server, no persistence (details in §1–2 above).
- Confirmed via grep: routing is a bare `useState` string switch (`navigate(pageId)`), unknown ids fall back silently rather than 404ing.
- Confirmed: zero `localStorage`/`sessionStorage`/network calls anywhere — the good news is there is also currently no data-leak surface, because there is no data.

## C. Accessibility findings
- **Confirmed bug:** `HeroGlobe`'s outer `<svg>` has `aria-hidden="true"` (line 387) while its `GLOBE_CALLOUTS` render as `<g role="link" tabIndex={0}>` — focusable elements inside an aria-hidden subtree. Screen readers cannot reach them; some browsers also pull focusable-but-hidden elements out of tab order inconsistently. **Fix in Phase 10:** remove `aria-hidden` from the outer `<svg>`, keep it only on the purely decorative dot field/wireframe, and give each callout group a real accessible name (already has one) that's actually reachable.
- The journal-art decorative SVG's `aria-hidden` (line 437) is correct as-is — it has no interactive content.
- Contrast was already audited and fixed in the previous pass (verified via computed-style testing, not visual guess) — that finding still holds.

## D. Resume-to-module mapping (per your §45)

| Resume section | Destination |
|---|---|
| Projects (2) | Engineering OS |
| Skills (by category) | About / Skills-with-evidence (§29 model, not percentages) |
| Education | About OS + Timeline OS |
| Experience (Business Analyst internship) | About OS + Timeline OS |
| Certifications | Learning Hub |
| Contact (email, LinkedIn, GitHub, location) | About OS |

---

**Next, if you'd like me to proceed:** Phase 2 — repo scaffold (real Next.js file tree, `package.json`, `tsconfig.json`, Tailwind config, `.env.example`, and the seed script that loads *only* the verified data above). I'd deliver that as a downloadable project folder, since a real multi-file Next.js app isn't something the Claude.ai artifact preview can run — you'd `npm install` and connect your own Supabase project to actually run it.
