# Sharma-Raghav OS — Upgrade & Security Audit

Date: 17 Aug 2026

## Baseline preserved

The known-good theme implementation and animated Hero Globe were intentionally left intact. This upgrade does **not** introduce a new ThemeProvider or replace the globe animation architecture.

## Changes in this upgrade

- Reorganized navigation into Command / Knowledge / Build / Security / Personal / System.
- Added `/now`, `/changelog`, `/docs`, and `/privacy`.
- Added `sitemap.xml`, `robots.txt`, and a web app manifest through Next metadata routes.
- Added `/.well-known/security.txt`.
- Added loading skeletons for primary database-backed sections.
- Expanded the About experience with profile focus and principles.
- Expanded the Public API page with endpoint and operational documentation.
- Upgraded the search modal into a lightweight command palette while retaining real database search.
- Added HSTS and request IDs to the existing security middleware.
- Stopped public API error responses from exposing raw database exception messages.
- Kept admin defense-in-depth: middleware + server-side `requireAdmin()` + database/RLS design.

## Security findings

### High priority before production

1. **Next.js 14 is unsupported.** The repository currently resolves Next 14.2.35. Next.js officially lists 14.x as unsupported. Current supported LTS lines are 16.x Active LTS and 15.x Maintenance LTS.
2. The dependency lockfile should be regenerated on a machine with registry access before deployment. Recommended maintenance-line target: `next@15.5.21` with the matching `eslint-config-next` release and a compatible React version.
3. Run `npm audit` after dependency installation and review all transitive findings before publishing.

### Existing controls retained

- CSP with per-request nonce.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- Strict referrer policy.
- Permissions policy disabling camera, microphone, and geolocation.
- HSTS.
- Server-side admin authorization.
- Zod validation for admin/content input.
- Explicit public-content filters in data access.
- Audit logging for administrative mutations.
- Generic API 500 responses.

### Still recommended

- Add a durable distributed rate limiter for login, search, public API, AI Terminal, and admin mutations.
- Add `request_id` to the persisted audit schema if the database migration can be changed; the current upgrade only exposes the request ID at the HTTP layer.
- Add automated end-to-end tests for logged-out `/admin/*` and `/api/v1/admin/*` access.
- Verify Supabase RLS policies directly against the production schema.
- Connect real uptime/analytics sources before displaying operational telemetry beyond database-backed counts.

## Dependency upgrade command

After extracting this project on a machine with npm registry access:

```bash
npm install next@15.5.21 react@19.1.1 react-dom@19.1.1 eslint-config-next@15.5.21
npm audit
npm run typecheck
npm run build
```

Do not deploy until the typecheck and production build succeed.

## Rollback

Keep the current Git commit as the stable baseline before applying the dependency upgrade. If the upgrade breaks anything, restore that commit or deploy the previous Vercel deployment.
