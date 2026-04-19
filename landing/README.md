# Patriot Ops Center — Landing Page

The marketing / pre-launch landing page served at [patriot-ops.com](https://patriot-ops.com). Collects waitlist signups via Resend while the main app is in active development. CTAs all point at the on-page waitlist form — no live app links yet.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 (theme tokens match the beta app — navy/gold military palette)
- Resend (waitlist audience + confirmation email)
- React Email (typed email templates)
- Lucide icons
- Deployed on Vercel, same repo as the beta (`Patriot-Ops-Center`), Root Directory = `landing`

## Project structure

```
landing/
├── src/
│   ├── app/
│   │   ├── page.tsx              # home — hero, two wings, timeline, pricing, orgs, waitlist
│   │   ├── layout.tsx            # root layout, Inter font, metadata
│   │   ├── globals.css           # theme tokens + utility classes (grid-pattern, corner-brackets, etc.)
│   │   ├── privacy/page.tsx      # Privacy Policy
│   │   ├── terms/page.tsx        # Terms of Service
│   │   ├── cookies/page.tsx      # Cookie Policy
│   │   └── api/
│   │       ├── waitlist/route.ts     # POST — add to Resend audience + send confirmation
│   │       ├── unsubscribe/route.ts  # GET — unsubscribe from audience
│   │       └── health/route.ts       # GET — uptime check
│   ├── components/
│   │   ├── Navbar.tsx            # sticky nav, "Join the Waitlist" CTA
│   │   ├── Footer.tsx            # site footer with platform/org/company columns
│   │   ├── WaitlistForm.tsx      # client component, submits to /api/waitlist
│   │   └── LegalShell.tsx        # shared wrapper for privacy/terms/cookies pages
│   └── emails/
│       └── WaitlistConfirmation.tsx  # React Email template, themed navy/gold
├── public/                       # logo.svg, logo.png, vob-logo.png
├── next.config.ts                # security headers, CSP
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## Local development

```bash
cd landing
cp .env.example .env.local      # fill in RESEND_API_KEY + RESEND_AUDIENCE_ID
npm install
npm run dev                     # http://localhost:3001
```

### Required environment variables

| Variable                | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `RESEND_API_KEY`        | Resend API key for waitlist + email                |
| `RESEND_AUDIENCE_ID`    | Resend audience ID where signups are added         |
| `NEXT_PUBLIC_SITE_URL`  | Public URL of this landing (default patriot-ops.com) |

## Deploying to Vercel — step by step

The beta (`Patriot-Ops-Center` root) already has its own Vercel project pointing at `beta.patriot-ops.com`. This guide creates a **second** Vercel project in the same repo, targeting the `landing/` subfolder, and cuts `patriot-ops.com` over to it.

### 1. Create the new Vercel project

1. Vercel Dashboard → **Add New** → **Project**.
2. Select **Continue with GitHub** and import `Patriot7Six/Patriot-Ops-Center`.
   Vercel may warn the repo is already imported — click **Import anyway**.
3. Project Name: `patriot-ops-landing` (or whatever you prefer).
4. Framework Preset: **Next.js** (auto-detected).
5. **Root Directory**: click **Edit** → type `landing` → **Continue**.
6. Build Settings: leave defaults (`next build`, output `.next`).

### 2. Add environment variables

In the same **New Project** screen, expand **Environment Variables** and add:

| Name                     | Value                                |
| ------------------------ | ------------------------------------ |
| `RESEND_API_KEY`         | *(copy from old PoC-Landing-Page project → Settings → Environment Variables)* |
| `RESEND_AUDIENCE_ID`     | *(copy from old PoC-Landing-Page project)* |
| `NEXT_PUBLIC_SITE_URL`   | `https://patriot-ops.com`            |

### 3. Deploy

Click **Deploy**. First build takes ~2–3 minutes. Vercel assigns a preview URL like `patriot-ops-landing-<hash>.vercel.app`.

### 4. Test on the preview URL

Before cutting over the real domain, verify:

- [ ] Home page loads, theme looks right (navy bg, gold accents, Inter font)
- [ ] Hero, Two Wings, Timeline, How It Works, Pricing, Orgs, Founder, FAQ, Waitlist sections all render
- [ ] All CTAs scroll/link to the `#waitlist` section
- [ ] `/privacy`, `/terms`, `/cookies` all load
- [ ] Waitlist form — submit a test email → success message
- [ ] Confirmation email arrives (check spam) with correct styling, logo, unsubscribe link
- [ ] Click the unsubscribe link → success page → contact is marked unsubscribed in Resend dashboard
- [ ] `/api/health` returns `{ "status": "ok", ... }`
- [ ] Mobile: hamburger menu, responsive layouts, forms usable

### 5. Cut over the `patriot-ops.com` domain

This is the actual switch. Both the old PoC-Landing-Page project and the new project exist at this point — we're just moving the domain.

1. Go to the **old** `PoC-Landing-Page` Vercel project → **Settings → Domains**.
2. Next to `patriot-ops.com`: click **Remove** → confirm.
   *(If `www.patriot-ops.com` is also listed, remove it too.)*
3. Go to the **new** `patriot-ops-landing` project → **Settings → Domains → Add**.
4. Enter `patriot-ops.com` → **Add**. Vercel attaches the SSL cert automatically.
5. Add `www.patriot-ops.com` as well — set it to **Redirect to `patriot-ops.com`** (or flip the redirect direction if you prefer `www` as canonical).
6. DNS records auto-update since both projects are on Vercel — propagation is usually < 1 minute.

### 6. Verify in production

- Open `https://patriot-ops.com` in an incognito window → confirm it's the new landing.
- Submit a real test email from the production form → confirm it lands in Resend's audience.
- Check the confirmation email renders correctly in Gmail + Apple Mail.

### 7. Clean up

Once you're confident the new landing is healthy (give it a day or two):

1. **Old Vercel project**: `PoC-Landing-Page` → Settings → scroll to the bottom → **Delete Project**.
2. **Old GitHub repo**: `Patriot7Six/PoC-Landing-Page` → Settings → scroll to the bottom → **Archive this repository**.

### Rollback (if something is broken in step 5)

1. Remove `patriot-ops.com` from the **new** project → Settings → Domains.
2. Re-add `patriot-ops.com` to the **old** `PoC-Landing-Page` project → Settings → Domains.

Total rollback time: ~2 minutes. Both projects still exist, so the old one is already warm.

## Notes on the Resend setup

- The waitlist endpoint is idempotent — duplicate emails return a friendly "already on the waitlist" message instead of an error.
- The confirmation email uses the typed React Email component at [src/emails/WaitlistConfirmation.tsx](src/emails/WaitlistConfirmation.tsx) — edit markup/styles there and the changes flow through to the next send.
- The unsubscribe handler uses raw `fetch` because the current Resend SDK doesn't expose contact lookup by email — if that changes upstream, simplify [src/app/api/unsubscribe/route.ts](src/app/api/unsubscribe/route.ts).
- `From` address is hardcoded to `Bradley Baker at Patriot Ops Center <noreply@email.patriot-ops.com>` in [src/app/api/waitlist/route.ts](src/app/api/waitlist/route.ts) — change there if you want a different sender.
