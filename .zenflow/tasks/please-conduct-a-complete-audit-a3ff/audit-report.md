# Patriot Ops Center — Complete Project Audit

**Date**: 2026-05-06
**Branch**: `please-conduct-a-complete-audit-a3ff`
**Auditor**: Claude (Opus 4.7)
**Scope**: Read-only audit. No code changes made.
**Target**: Next.js 16 / React 19 / TypeScript app at `beta.patriot-ops.com`. Stack: Supabase (auth + Postgres + RLS + storage), Anthropic Claude (RAG career chat, eligibility, claims), Stripe (subscriptions), Resend (email), Trigger.dev v4 (background jobs), Sentry (errors), Upstash Redis (rate limit), Amplitude + Vercel Analytics.

---

## Executive Summary

The codebase is **structurally sound** for a ~9-month, single-team build: the App Router layout, server/client split, Supabase + RLS coverage, Stripe webhook hygiene, and Trigger.dev job offload all reflect deliberate engineering. TypeScript `strict` is enforced, Sentry is wired end-to-end, and migrations tell a clean Sprint-2 → Sprint-9b story.

That said, **the project is not production-ready** in the form audited. There are several **build-blocking** and **security-critical** issues that need to be addressed before launching to `patriot-ops.com`, and a meaningful tier of medium-severity issues that, while not exploitable in isolation, accumulate into real risk under a public launch.

The headline issues:

| # | Severity | Issue |
|---|----------|-------|
| 1 | **Critical (build-breaking)** | `package-lock.json` is gitignored AND missing — CI's `npm ci` cannot run on a fresh checkout. |
| 2 | **Critical (security)** | Open-redirect in `/api/auth/callback` via unvalidated `next` query param. |
| 3 | **Critical (security)** | Sentry server/edge configs hardcode the DSN and ship `sendDefaultPii: true` + `tracesSampleRate: 1` regardless of environment. |
| 4 | **Critical (supply chain)** | `xlsx@0.18.5` — known prototype-pollution / ReDoS issues; used in OGC sync. |
| 5 | **Critical (test coverage)** | Zero `.test.ts/.spec.ts` files in `src/`. Vitest + Storybook are configured but unused for assertions. |
| 6 | **High** | `/api/ai/*` is in `PUBLIC_ROUTES` so it bypasses both the beta gate and the middleware auth — relies on each route to re-implement its own check. |
| 7 | **High** | Stripe webhook does not idempotency-guard event IDs and does not fail loudly on missing `STRIPE_WEBHOOK_SECRET`. |
| 8 | **High** | Numerous required env vars are referenced in code but absent from `.env.example` (Sentry DSN, Amplitude key, Upstash, Resend audience, OGC URLs, ADMIN_*, BETA_ACCESS_PASSWORD, additional Stripe price IDs). |
| 9 | **High** | Sentry has been initialised twice on the client (`sentry.client.config.ts` *and* `src/instrumentation-client.ts`) with conflicting settings. |
| 10 | **High** | `/api/sentry-example-page` and `/api/sentry-example-api` are still wired up — these intentionally throw and will pollute production telemetry. |

Below is the full breakdown.

---

## 1. Build, Dependencies & Reproducibility

### CRITICAL — `package-lock.json` is gitignored and missing

- `.gitignore:85` excludes `package-lock.json`.
- Confirmed via `git ls-files`: no lockfile is tracked, and none exists on disk in this worktree.
- `.github/workflows/ci.yml:32, 64, 113` all run `npm ci`, which **requires** a lockfile. On a clean checkout, every CI job will fail at install.
- This also breaks Doppler-injected production builds (`ci.yml:67`).
- **Fix**: remove `package-lock.json` from `.gitignore`, run `npm install`, commit the lockfile.

### CRITICAL — `xlsx@0.18.5` (SheetJS) — known vulnerabilities

- `package.json:38`. Referenced in `trigger/jobs/ogc-sync.ts` to parse the OGC accreditation roster (a remote Excel URL — i.e., third-party-controlled input).
- 0.18.x has CVE-class issues (prototype pollution, ReDoS). The official SheetJS guidance is to migrate off the npm package to the CDN tarball or ≥0.20.x.
- **Fix**: upgrade `xlsx` per SheetJS instructions, or replace with `exceljs` / a streaming parser if the OGC file format permits.

### HIGH — Trigger.dev SDK pinned to `4.4.0` exactly

- `package.json:22` uses `"@trigger.dev/sdk": "4.4.0"` (no caret). The build script also pins the CLI: `npx trigger.dev@4.4.0` (`package.json:12-13`).
- This is intentional — Trigger.dev v4 is young — but it means security/bug fixes won't flow in. Document the rationale and set a quarterly review.

### MEDIUM — `tsconfig.json` targets `ES2017`

- `tsconfig.json:3`. Modern Next.js + React 19 deployments should target `ES2020` or rely on Next's per-runtime transpile. ES2017 inflates polyfills.

---

## 2. Security

### CRITICAL — Open redirect in `/api/auth/callback`

- `src/app/api/auth/callback/route.ts:7, 61`: `const next = searchParams.get('next') ?? '/dashboard'` is interpolated directly into `NextResponse.redirect(\`${origin}${next}\`)`.
- A crafted `next=//evil.com` or `next=https://evil.com` produces a redirect after a successful Supabase code exchange — i.e., **post-login phishing**.
- **Fix**: reject any `next` value that isn't a same-origin path (`startsWith('/')` AND `!startsWith('//')` AND `!startsWith('/\\')`).

### CRITICAL — Sentry configs ship PII to Sentry in production

- Three separate `Sentry.init(...)` calls all set `sendDefaultPii: true` unconditionally:
  - `sentry.server.config.ts:18`
  - `sentry.edge.config.ts:19`
  - `src/instrumentation-client.ts:28`
- Same files set `tracesSampleRate: 1` (100%) with no production guard.
- DSN is **hardcoded** in `sentry.server.config.ts:8`, `sentry.edge.config.ts:9`, and `src/instrumentation-client.ts:8` (only `sentry.client.config.ts:5` reads from `process.env.NEXT_PUBLIC_SENTRY_DSN`).
- This is a VA-benefits app — captured PII can include emails, IPs, headers, condition summaries surfaced in stack traces. **Likely a privacy/compliance issue**.
- **Fix**: gate `sendDefaultPii` to non-prod, scrub via `beforeSend`, drop sample rate to ~0.05–0.1 in prod, move DSN to env.

### CRITICAL — Two Sentry client initialisations

- `sentry.client.config.ts` AND `src/instrumentation-client.ts` both call `Sentry.init`, but with **different settings** (the former scrubs cookies in `beforeSend` and gates by `NODE_ENV`; the latter does neither and turns on Replay).
- Next.js 15+ uses `instrumentation-client.ts`; the legacy `sentry.client.config.ts` is no longer auto-loaded but is still in the repo. If anything imports it, you get double-init. Either way, the active config is the unguarded one.
- **Fix**: delete `sentry.client.config.ts`, fold its safer settings into `instrumentation-client.ts`.

### CRITICAL — Sentry example endpoints still live

- `src/app/sentry-example-page/page.tsx`
- `src/app/api/sentry-example-api/route.ts`
- These intentionally throw. In production they're DDoS-able error generators that will burn through Sentry quota and pollute the issue tracker.
- **Fix**: delete both before launch.

### HIGH — `/api/ai/*` bypasses the middleware

- `src/proxy.ts:65-71` lists `/api/ai`, `/api/auth`, and `/api/stripe` as `isPublic`. That means **the beta gate AND `getUser()` are skipped** for the entire AI surface.
- Each AI route does re-check auth itself (e.g., `src/app/api/ai/career/route.ts:52-56`, `documents/route.ts:34-39`), but `claims` and `eligibility` deliberately allow anonymous users with IP-based rate limit only.
- IP rate-limiting in `src/lib/ratelimit.ts:58-64` reads the first hop of `x-forwarded-for`, which on Vercel is generally trustworthy but is **not** validated against a trusted-proxy list. Header spoofing on edges that don't strip it would defeat the cap.
- This is also the bypass that lets the beta gate be skipped on AI traffic — anonymous internet users can still hit Claude on your dime, just with a 10-req/IP/24h cap.
- **Fix**: at minimum, document the auth model on each AI route; preferably remove from `PUBLIC_ROUTES` and gate in middleware so a future AI route can't accidentally ship without auth.

### HIGH — Stripe webhook: missing-secret + replay risk

- `src/app/api/stripe/webhook/route.ts:19` calls `getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)` with non-null assertion. If the env var is missing, this throws an unhelpful runtime error rather than failing fast at boot.
- No idempotency check on `event.id`. Stripe explicitly retries; without dedup, status transitions can flip twice (the current handlers are mostly idempotent at the SQL layer, but `subscription.deleted` → tier downgrade ordering is fragile if the upgrade event lands second).
- **Fix**: explicit `if (!process.env.STRIPE_WEBHOOK_SECRET) return 500` at top; persist processed `event.id`s in Redis with a TTL; check before applying.

### HIGH — Admin gate is an env-var email allowlist

- `src/app/api/admin/agents/route.ts:16-32`. The check is `ADMIN_EMAILS.split(',').includes(user.email)`. If the env var is absent, all callers get 500 — which leaks the route's existence and breaks legitimate admins on misconfiguration.
- No audit log on admin mutations. For a product that gates which agents reach veterans, **lack of audit trail is a real problem**.
- **Fix**: add an `is_admin` boolean (or role enum) to `profiles`, gate on it, and append every admin write to a `case_events`-style audit table.

### HIGH — File upload trusts client `file.type`

- `src/app/api/documents/upload/route.ts:52-55` validates against the client-provided MIME. The id used to write to Supabase storage is generated with `Math.random().toString(36).slice(2)` (line 58) — not cryptographically random.
- **Fix**: use `crypto.randomUUID()` for the storage key; sniff magic bytes server-side (e.g., `file-type` package) before accepting; enforce size again server-side.

### HIGH — CSP allows `unsafe-eval` + `unsafe-inline`

- `next.config.ts:26`. With those two directives, the rest of the CSP is mostly cosmetic against XSS. This is partly a Next.js + Sentry constraint, but a **nonce-based** CSP is achievable and is the right end-state.

### MEDIUM — Open-redirect-shape patterns elsewhere

- `src/proxy.ts:38, 77` and `src/app/beta-gate/page.tsx`, `src/app/(auth)/login/page.tsx` accept a `redirectTo` query param and send the user there after the gate / login. These are filtered to relative paths in some places and not in others — needs a single shared `safePath()` helper.

### MEDIUM — Beta gate token compare

- `src/lib/beta-gate.ts:31-43` does a manual constant-time-ish loop. It's "close enough" but the right primitive is `crypto.timingSafeEqual()`. Same code path also has no token-version field, so a password rotation will not invalidate existing cookies until they expire.

### MEDIUM — DB error messages are returned verbatim

- e.g., `src/app/api/admin/agents/route.ts:37, 49, 95` return `{ error: error.message }` straight from Supabase. This can leak schema names and constraint names to attackers.
- **Fix**: log full error to Sentry, return a generic message + Sentry event ID to the client.

### LOW / INFO — `using (true)` RLS policies

- 4 occurrences confirmed:
  - `20260201_sprint2.sql:96` — `benefits` table, **public reference data**, intentional.
  - `20260215_sprint3.sql:83` — `subscriptions`, **service-role only**.
  - `20260301_sprint4.sql:57` — `usage_counters`, **service-role only**.
  - `20260423_sprint9.sql:167` — `ogc_accreditations`, **public OGC roster**, intentional.
- Service-role policies of `using (true)` are effectively no-ops because the service role already bypasses RLS. They're not a vulnerability — but they're misleading. Annotate or remove.

### INFO — Redirect / referer hardening

- `next.config.ts:12-37` sets HSTS, X-Frame-Options DENY, nosniff, strict-origin-when-cross-origin Referrer-Policy, restrictive Permissions-Policy. Good defaults.

---

## 3. Database & Migrations

(All file references below are under `supabase/migrations/`.)

### Strengths

- RLS is **enabled** on every user-data table. Every read/write policy I checked is scoped by `auth.uid()` or the service role.
- Foreign keys exist where they should (`auth.users(id)` chains throughout).
- `ON DELETE` choices are sensible: cascade for owned data (documents, cases, events), `set null` for soft links (`agent_id` on `referral_cases`, `actor_user_id` on `case_events`).
- Sprint 7 RAG creates an IVFFlat vector index on `knowledge_chunks.embedding` with `lists = 100` — appropriate for the current corpus size.
- `SECURITY DEFINER` functions (`handle_new_user`, `handle_new_subscription`) explicitly `set search_path = public` and contain no dynamic SQL.
- Sprint 9b cleans up earlier ogc-accreditation indexing missteps cleanly.

### MEDIUM — Missing post-rename index on `knowledge_chunks.category`

- Sprint 7 RAG created `va_knowledge_category_idx`. Sprint 9's rename to `knowledge_chunks` (`20260420_pre_sprint9_rag_rename.sql`) does not appear to recreate the category index. RAG queries that filter by category will table-scan.

### MEDIUM — `usage_counters` has no `(user_id, month)` index

- `20260301_sprint4.sql:38-45`. The composite unique on `(user_id, month, feature)` covers point-lookups by feature, but admin/usage-summary queries that group by month do a scan.

### LOW — No `CHECK` constraints on rating ranges

- `20260423_sprint9.sql:185-186` — `current_rating` / `requested_rating` are integers with no `CHECK (rating BETWEEN 0 AND 100)`. App-layer validation only.

### LOW — `profiles` columns are all nullable

- `20260215_sprint3.sql:12-19`. This is reasonable during the onboarding dance, but means there's no DB-level guarantee that an "onboarded" user has, say, a branch — onboarding completeness lives entirely in app code.

---

## 4. API Routes

22 route handlers across `src/app/api/**`. Strengths first:

- Every mutating route I sampled does `await supabase.auth.getUser()` and rejects unauthenticated callers (where the route isn't deliberately anonymous).
- All wrap external SDK calls in `try/catch` and `console.error` on the failure path.
- Stripe webhook correctly uses `await request.text()` for the raw body before signature check.
- Rate limiting is wired through `src/lib/ratelimit.ts` and is applied to the four AI routes plus document upload.

### Specific findings (in addition to the security ones above)

#### MEDIUM — Inconsistent tier names

- Sprint 8 collapsed tiers to `free | elite`, but earlier sprint code/comments still reference `special-ops`/`pro`. `src/app/api/documents/upload/route.ts:21, 30` checks `tier === 'elite'` while comments and other paths mention "Special Ops" pricing. A single `subscriptionTier` constant in `src/types/subscription.ts` (or wherever) would prevent silent bypass when names diverge.

#### MEDIUM — `practice_states` and `state` are not allowlisted

- `src/app/api/agent/apply/route.ts:55-60` and `src/app/api/referrals/submit/route.ts:66-68` accept any 2-letter string as a US state. A typo'd `XX` will silently route the case to no-one.

#### MEDIUM — `scope` query param accepted blindly

- `src/app/api/agent/cases/route.ts:36` defaults `scope` to `'open'` but accepts any string. `if (scope !== 'open' && scope !== 'mine')` would catch typos.

#### MEDIUM — `outcome` route TODO

- `src/app/api/agent/outcome/route.ts:71-73` defers per-case billing to "Sprint 10". If Sprint 10 was meant to be done before launch, this is a revenue gap; otherwise it's a known no-op.

#### LOW — Subscription falls back to `'free'` silently

- e.g., `src/app/api/ai/career/route.ts:65`, `src/app/api/ai/documents/route.ts:48`. If the subscription row is missing for an authenticated user, the route quietly serves the free experience. Should at minimum log to Sentry — that's a data-integrity signal worth knowing.

---

## 5. Code Quality, TS, and Architecture

### Strengths

- TypeScript `strict: true` is on, and there are **no `@ts-ignore`/`@ts-expect-error`** in the source. `unknown` is used defensively and narrowed (`api/stripe/webhook/route.ts:146`, `api/beta-gate/route.ts:12-20`).
- Components stay small (~120-150 LOC average). No monster files.
- Server-vs-client split is deliberate (Footer / dashboard layout server, chat / uploader / sidebar client).
- Server pages batch reads via `Promise.all` (e.g., `src/app/dashboard/layout.tsx:12-15`).
- `instrumentation.ts` correctly forks Sentry imports by `NEXT_RUNTIME`.

### CRITICAL — Zero unit/integration tests

- No `*.test.ts(x)` or `*.spec.ts(x)` files in `src/` (verified). Vitest, Storybook test addon, Playwright browser provider are all installed and configured, but nothing asserts anything.
- Concrete starting points: `src/lib/agent-matching.ts` (pure scoring), `src/lib/ratelimit.ts`, `src/lib/beta-gate.ts`, `src/app/api/referrals/submit/route.ts` validators.

### MEDIUM — Rate-limit and auth wiring is duplicated across routes

- ~6 routes hand-roll a tier-aware rate-limit dance. A small `withAuth(handler, { tier })` HOF would remove ~40 lines per file and prevent forgotten checks. Currently a soft maintenance debt.

### LOW — `landing/` is a separate Next.js project, undocumented

- `landing/` has its own `package.json`, `next.config.ts`, `tsconfig.json`. It's the marketing/waitlist site at `patriot-ops.com`; the audited app lives at `beta.patriot-ops.com`. The root `README.md` is *literally* one line, so a new dev cannot tell these apart.

### LOW — Comments in code reference "sprint2 / sprint5 / sprint10" planning artefacts

- Harmless, but they'll rot as the calendar moves on. Consider replacing with feature names ("Beta gate", "RAG embeddings") before public launch.

---

## 6. Frontend & Accessibility

### HIGH — Click handlers on `<div>` instead of `<button>`

- `src/components/CareerChat.tsx:102, 155` (starter prompts, "Clear conversation").
- `src/components/DocumentUploader.tsx:77` (drop zone is a div with onClick — needs explicit role/keyboard handling).
- `src/components/ResumeAnalyzer.tsx:85-90` (show/hide tips).
- `src/components/Navbar.tsx:57-71` mobile-menu button is missing `aria-expanded`.
- These break keyboard navigation, screen readers, and (for some) focus styles.

### HIGH — Missing route-level error boundaries

- `src/app/error.tsx` and `src/app/global-error.tsx` exist, but `src/app/dashboard/error.tsx` and `src/app/agent/error.tsx` do not. A failure inside a dashboard subtree currently bubbles to the root error page.

### MEDIUM — Client components fetching where server components could

- `src/app/dashboard/documents/page.tsx:24-32` is a client component fetching `/api/documents` in `useEffect`. The page can be a server component that fetches directly via Supabase (with the user's cookie) and hands data to a client `DocumentList`. Saves a round trip, removes a client-side spinner, halves the JS shipped.

### MEDIUM — `<img>` instead of `next/image`

- Logos and the VOB badge in Navbar / Footer / DashboardSidebar use raw `<img>`. Logos are tiny so the impact is small — but `next/image` standardises lazy-loading and intrinsic sizing.

### LOW — No toast / notification primitive

- Uploads, deletes, and form submissions only show inline error text. Success cases are silent (e.g., document uploaded → list refreshes with no confirmation). A small toast library (sonner) would noticeably improve perceived quality.

### LOW — `lucide-react` imported in ~all client components

- This is fine *with* Next.js tree-shaking, but worth confirming the production bundle is treeshaking icon-by-icon (which it does when imported as `import { X } from 'lucide-react'`). Spot-check a `next build --analyze` run before launch.

### INFO — Storybook a11y addon present, set to `'todo'`

- `.storybook/preview.ts`. Good that it exists; flipping to `'error'` once the stories are cleaned up gives a real CI gate.

---

## 7. Background Jobs (Trigger.dev)

- `trigger/jobs/` contains: `digest`, `documents`, `emails`, `expire-cases`, `knowledge-sync`, `ogc-sync`, `subscriptions`, `usage`. Each is a discrete responsibility. The naming + scheduling (where present) is clear from the file names.

### MEDIUM — Inconsistent error handling

- Several jobs (`emails.ts`, `subscriptions.ts`) call `Resend` / `Supabase` without wrapping in try/catch. Trigger.dev will retry, but failures don't go to Sentry, and there's no business-level alert when, say, the welcome email silently fails for a paying user.
- **Fix**: in each job, `try { ... } catch (e) { Sentry.captureException(e, { tags: { job: '<name>' } }); throw e }`.

### HIGH — `ogc-sync.ts` ingests external XLSX

- Combined with the `xlsx@0.18.5` issue (§1), this job is the highest-risk untrusted-input vector in the project. The XLSX file is fetched from a URL set in env (`OGC_ATTORNEYS_URL`, `OGC_CLAIMS_AGENTS_URL`).

---

## 8. DevOps, CI, Secrets, Env

### CRITICAL — `.env.example` is incomplete

Variables used in code but **missing** from `.env.example`:

| Variable | Used in |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | `sentry.client.config.ts:5` |
| `NEXT_PUBLIC_AMPLITUDE_API_KEY` | `src/lib/amplitude.ts` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `src/lib/ratelimit.ts` |
| `RESEND_AUDIENCE_ID` | `src/lib/resend-audiences.ts` |
| `OGC_ATTORNEYS_URL`, `OGC_CLAIMS_AGENTS_URL` | `trigger/jobs/ogc-sync.ts` |
| `ADMIN_EMAILS`, `ADMIN_SECRET` | `src/app/api/admin/agents/route.ts`, `src/app/api/launch/announce/route.ts` |
| `BETA_ACCESS_PASSWORD` | `src/proxy.ts:16` |
| `STRIPE_PRICE_PRO_MONTHLY` (and other prices) | webhook + checkout routes |

A new dev cannot stand the project up locally without this list.

### HIGH — Doppler is referenced but undocumented

- `.gitignore:24` directs the reader to `sprint7/README.md` — a directory that does not exist. The CI file (`.github/workflows/ci.yml:46-69`) installs the Doppler CLI and runs `doppler run -- npm run build`, but there is no setup guide, project name, or env mapping anywhere in the repo.

### HIGH — CI does not run lint, tests, or security scans

- `ci.yml` runs only `type-check`, `build`, `storybook build`, and `sentry-release`. There's no `npm run lint`, no test step (because no tests), no `npm audit`, no Snyk/Dependabot config visible in `.github/`.

### MEDIUM — Sentry org mismatch

- `next.config.ts:46` uses `org: "patriot-7six"`.
- `.github/workflows/ci.yml:89` uses `SENTRY_ORG: patriot-ops-center`.
- Pick one and align them, otherwise releases are uploaded to a different org than source maps.

### MEDIUM — Vercel preview environment

- The CI flow injects Doppler secrets only into the GitHub-Actions build job. Vercel preview deploys (the ones reviewers actually click) need their own Vercel-side env config; otherwise previews silently misbehave.

### LOW — `README.md` is one line

- Literally `# Patriot-Ops-Center`. No setup, no architecture, no deploy-runbook. Combined with the missing Doppler docs and incomplete `.env.example`, onboarding any new collaborator is currently a tribal-knowledge exercise.

### INFO — `.devcontainer/` is committed

- This is intentional and well-commented in `.gitignore:1-5`. Codespaces secrets live in GitHub settings.

---

## 9. Observability

- **Sentry**: present and important — but configured aggressively (PII on, 100% traces, two client init paths). See §2.
- **Amplitude**: `src/lib/amplitude.ts` + `AmplitudeProvider`. No sample-rate cap; sends product analytics directly from the browser.
- **Vercel Analytics + Speed Insights**: in `package.json`. Lightweight.
- The combination is **three separate vendors** receiving overlapping user-event data. Consider whether all three are pulling their weight, especially given the privacy implications of a VA-benefits product.

---

## 10. Strengths Worth Preserving

So the report is balanced: things this codebase does well that should not be regressed in remediation.

- App Router + server components used appropriately.
- RLS coverage is thorough and the policies are simple — no clever tricks to debug later.
- Stripe webhook handling reads the raw body correctly and stores enough subscription metadata to reconcile.
- The Trigger.dev split keeps long-running work (RAG ingest, OGC sync, email sends) off the request path.
- Security headers in `next.config.ts` are well-thought-out (HSTS, frame-ancestors, Permissions-Policy).
- Beta-gate / Supabase-auth two-layer model is conceptually right for a private-beta product.
- Sentry replay masks all text + blocks media (`sentry.client.config.ts:9-12`) — the *one* config that handles PII correctly. Use it as the model for the others.
- `instrumentation.ts` correctly forks runtime imports.
- Migrations are tidy, additive, and tell a coherent story sprint-over-sprint.

---

## 11. Prioritised Remediation Roadmap

**Block launch on these (1–2 days):**

1. Restore `package-lock.json` (un-ignore + commit). CI is dead without it.
2. Fix `/api/auth/callback` open redirect (validate `next` is a same-origin path).
3. Move Sentry DSN to env, gate `sendDefaultPii` and `tracesSampleRate` on `NODE_ENV`, and delete the duplicate `sentry.client.config.ts`.
4. Delete `sentry-example-page` and `sentry-example-api`.
5. Upgrade `xlsx` (or replace) before the next OGC sync run.
6. Fail fast in the Stripe webhook when `STRIPE_WEBHOOK_SECRET` is missing; add `event.id` idempotency.

**Before public production launch (1–2 weeks):**

7. Move `/api/ai/*` out of `PUBLIC_ROUTES`, or document and enforce per-route auth posture explicitly.
8. Replace the email-allowlist admin gate with a role column + audit log table.
9. Server-side magic-byte validation + `crypto.randomUUID()` storage keys for document uploads.
10. Allowlist US state codes in `referrals/submit` and `agent/apply`.
11. Add the missing variables to `.env.example`; write a `DOPPLER.md`.
12. Resolve the Sentry org mismatch.
13. Add `npm run lint` and at minimum a smoke-test step to CI.
14. Land 5–10 unit tests on `agent-matching`, `ratelimit`, `beta-gate`, and the referral validators — establish the testing habit before more code lands.
15. Add `error.tsx` for `dashboard/` and `agent/` route segments.
16. Fix the `<div onClick>` patterns (CareerChat, DocumentUploader, ResumeAnalyzer).

**Post-launch hygiene (next quarter):**

17. Tighten CSP toward nonce-based; drop `unsafe-eval`.
18. Add `crypto.timingSafeEqual` / token-version to the beta gate.
19. Centralise auth + rate-limit into a `withAuth(handler, opts)` HOF.
20. Migrate logos to `next/image`; consider a toast primitive (sonner).
21. Re-create the `knowledge_chunks.category` index dropped in the Sprint 9 rename.
22. Decide whether all three of Sentry / Amplitude / Vercel Analytics are needed; consolidate.
23. Replace sprint-numbered comments with feature-named ones.
24. Expand `README.md` with architecture, setup, and deploy sections; document the `landing/` ↔ main-app split.

---

## Appendix A — Directory Map (audit reference)

```
src/
  app/
    (auth)/        login, signup pages
    (marketing)/   landing-style routes
    agent/         agent-side dashboard
    api/           22 route handlers
      admin/       email-allowlist admin
      agent/       accept/decline/apply/cases/outcome
      ai/          career, claims, documents, eligibility, usage
      auth/        callback (open redirect) + supporting
      beta-gate/   token issuance
      documents/   list/delete/upload
      launch/      announce (admin secret)
      referrals/   list, submit
      sentry-example-api/   ⚠ delete before prod
      stripe/      checkout, portal, webhook
    benefits/      RAG-driven static pages
    beta-gate/     password page
    dashboard/     authed app surface
    onboarding/    profile setup
    pricing/       Stripe-driven page
    referral/      veteran-side flow
    sentry-example-page/   ⚠ delete before prod
  components/      ~12 React components + ui/ primitives
  hooks/
  lib/             agent-matching, anthropic, beta-gate, embeddings,
                   ogc-verification, rag, ratelimit, referral-cases,
                   resend, stripe, supabase, va-data, va-rates
  proxy.ts         middleware (beta gate + Supabase session)
  instrumentation.ts        registers Sentry per runtime
  instrumentation-client.ts ⚠ duplicates sentry.client.config.ts

supabase/migrations/   8 migrations (sprint2 → sprint9b) — all additive
trigger/jobs/          digest, documents, emails, expire-cases,
                       knowledge-sync, ogc-sync, subscriptions, usage
landing/               separate Next.js project (waitlist site)
.github/workflows/ci.yml   type-check + build + storybook + sentry-release
```

## Appendix B — Files to delete before production

- `src/app/sentry-example-page/page.tsx`
- `src/app/api/sentry-example-api/route.ts`
- `sentry.client.config.ts` (after merging its safer settings into `src/instrumentation-client.ts`)

---

*End of report.*
