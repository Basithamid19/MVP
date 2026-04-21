# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Aladdin Marketplace MVP — a two-sided services marketplace for local professionals in Vilnius. Next.js 15 (App Router) + TypeScript + Prisma/PostgreSQL + NextAuth v5 + Stripe Connect + Tailwind v4.

## Commands

```bash
npm run dev              # next dev
npm run build            # prisma generate && prisma migrate deploy && next build
npm run lint             # eslint .
npm run clean            # next clean
npm run prisma:seed      # seed categories, admin, customers, providers via npx tsx prisma/seed.ts

npx prisma generate              # regenerate client after schema.prisma changes
npx prisma migrate dev --name X  # create + apply a new migration locally
npx prisma migrate deploy        # apply pending migrations (used in build)
npx prisma studio                # DB GUI
```

There is **no test suite** in this repo. Do not add placeholder test scripts or claim tests exist.

`next.config.ts` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — the build will pass even with TS/ESLint errors. Run `npm run lint` explicitly; rely on `tsc --noEmit` (via `tsconfig.json`, `"strict": false`) locally since the build won't surface type errors.

## Environment

`.env` required for anything to run:

- `DATABASE_URL` — pooled Supabase URL (port 6543, `?pgbouncer=true`)
- `DIRECT_URL` — direct Supabase URL (port 5432), required by `prisma migrate deploy`
- `AUTH_SECRET` — NextAuth v5 secret (note: `AUTH_SECRET`, not `NEXTAUTH_SECRET`)
- `NEXTAUTH_URL` — canonical origin, also pinned in `vercel.json`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Architecture

### Roles and route gating

Three `UserRole` values: `CUSTOMER`, `PROVIDER`, `ADMIN`. `middleware.ts` enforces role-based redirects on matching routes:

- `CUSTOMER` → redirected away from `/provider/*` to `/dashboard`
- `PROVIDER` → redirected away from `/dashboard`, `/account`, `/bookings`, `/requests` to `/provider/dashboard`
- `ADMIN` → redirected away from customer routes to `/admin/dashboard`

Top-level route shape mirrors this: customer pages live at the root (`/dashboard`, `/browse`, `/bookings`, `/requests`, `/messages`, `/account`), provider pages under `/provider/*` (with its own `layout.tsx`), admin under `/admin/*`. API routes under `app/api/*`; `app/api/admin/*`, `app/api/provider/*`, and `app/api/payments/checkout` each re-check `session.user.role` server-side — middleware only redirects pages, it does not protect API routes.

### Auth (NextAuth v5, Credentials only)

Single source of truth: `lib/auth.ts` exports `{ handlers, auth, signIn, signOut }`. The `[...nextauth]/route.ts` file just re-exports `handlers`. Password hashing is bcryptjs.

- Session shape is augmented in `types/next-auth.d.ts`: `session.user.id` and `session.user.role` exist.
- Server code reads user ID as `(session.user as any).id` — the cast is load-bearing because the `id` field isn't on the default NextAuth types for callback overrides; match this pattern.
- The `session` callback does an ID lookup, then falls back to email lookup when `token.id` is stale. If you change auth, preserve that fallback — there are deployed JWTs with outdated IDs.

### Database (Prisma)

Schema in `prisma/schema.prisma`. Core flow: `ServiceRequest` (customer posts) → `Quote` (provider offers) → `Booking` (accepted) → `Payment` (Stripe) → `Review`. `ChatThread` dedupes on `(requestId, customerId, providerId)` and has an `isLocked` flag gating messaging until deposit is paid.

**Migration-safety pattern — important.** Several API routes defend against the DB being on an older migration than the schema. When adding fields:

- Write an explicit `select: { … } as const` listing only the columns you need.
- Wrap `findUnique`/`findMany` in `.catch()` that inspects the error for `column` / `P2022` / the new field name and falls back to a safer query. Examples in `app/api/chat/route.ts` (falls back from scalar `customerId`/`providerId` to `participants` relation) and `app/api/bookings/route.ts`.
- Don't remove these fallbacks unless you're also guaranteeing the migration has run in every environment. The newest migrations (`20260403*` chat dedup, `20260404*` rejection reason, `20260412*` booking settings, `20260417*` stripe fields, `20260420*` notifications) are exactly the ones guarded.

Prisma client is a global singleton in `lib/prisma.ts`; always import the default export (`import prisma from '@/lib/prisma'`), never `new PrismaClient()`. The `prisma/seed.ts` script is the one exception.

### Stripe (Connect + Checkout)

`lib/stripe.ts` exports a **lazy Proxy** around `Stripe` — the client is only constructed on first method call, not at import time. This is deliberate so `next build` works without `STRIPE_SECRET_KEY` set. Don't change it to eager instantiation.

Payment flow:

1. Customer accepts a quote → `Booking` created.
2. `POST /api/payments/checkout` creates a Stripe Checkout Session with `payment_intent_data.transfer_data.destination = provider.stripeAccountId`, a **20% deposit** as the line item, and a **10% platform fee** as `application_fee_amount`. Hard-coded fractions (`0.2`, `0.1`) — if these need to change, they live in `app/api/payments/checkout/route.ts`.
3. `POST /api/payments/webhook` (Stripe signature-verified) handles `checkout.session.completed`: sets `Payment.status = DEPOSIT_HELD`, unlocks the `ChatThread` (`isLocked: false`), and notifies both parties.
4. Provider onboarding to Stripe Express is under `app/api/provider/stripe-connect/*`; booking checkout errors out if `provider.stripeOnboarded` is false.

### Chat

- Polling-based, not websockets. Clients poll `/api/chat?threadId=…` and `/api/notifications` (see `CustomerLayout.tsx`/`provider/layout.tsx` — 15s interval).
- All outgoing message content is passed through `redactPII` (`lib/pii-filter.ts`), which strips phone numbers, emails, and off-platform app names (WhatsApp, Telegram, etc.). Do not bypass this for user-generated content.
- Chat is locked until deposit is paid; the API returns `{ locked: true }` with 403 when a customer tries to message before payment.

### Notifications

In-app only, stored in the `Notification` table. Always emit via `createNotification` from `lib/notifications.ts` — it catches errors and returns `null`, so notification failures never break the triggering flow. Types seen in code: `quote`, `booking`, `status`, `message`, `payment`, `review`, `lead`. `PATCH /api/notifications` accepts `{ ids }` or `{ markAllRead: true }`.

### i18n

Two locales — `en` (default) and `lt`. Dictionaries in `lib/i18n/{en,lt}.ts`; hook via `useTranslation()` / `useLocale()` from `lib/i18n`. Locale persists in `localStorage` under key `aladdin_locale`. The `<I18nProvider>` wraps the app in `app/layout.tsx`. New UI strings should be added to both dictionaries.

### Design system

Tailwind v4 with design tokens defined as CSS custom properties in `app/globals.css` under `@theme`. Use the semantic token classes — `bg-canvas`, `bg-surface-alt`, `text-ink`, `text-ink-sub`, `text-ink-dim`, `border-border`, `border-border-dim`, `bg-brand`, `bg-brand-muted`, `text-trust`, `bg-caution-surface`, etc. — instead of raw Tailwind colors. Radii: `rounded-chip` / `rounded-input` / `rounded-card` / `rounded-panel`. Font is Manrope via `next/font`, loaded in `app/layout.tsx`.

Shared UI primitives are barrel-exported from `components/ui/index.ts` (`Button`, `Input`, `Card`, `StatusBadge`, `StatCard`, `EmptyState`, `PageHeader`, `AddressAutocomplete`). The `cn()` helper in `lib/utils.ts` is `twMerge(clsx(...))`. Customer pages wrap in `components/CustomerLayout.tsx`; provider pages use `app/provider/layout.tsx` (which bypasses itself for `/provider/onboarding`). Mobile bottom nav is `components/MobileNav.tsx`.

### Path alias

`@/*` → repo root (configured in `tsconfig.json`). Use `@/lib/...`, `@/components/...`, etc. consistently.

## Conventions

- API route files almost always set `export const dynamic = 'force-dynamic'` — keep this on new routes that touch the session or DB, otherwise Next will try to statically evaluate them.
- Auth checks at the top of every handler: `const session = await auth(); if (!session?.user) return 401`. Role-gated endpoints also check `(session.user as any).role`.
- Ownership checks are explicit: resolve the `CustomerProfile` / `ProviderProfile` from `session.user.id`, then compare against the row's `customerId` / `providerId`. Don't trust IDs from the request body as authorization.
- Money is stored as `Float` in EUR; Stripe amounts are always `Math.round(x * 100)` cents.
- `avatarUrl(name)` in `lib/avatar.ts` is the canonical fallback avatar — use it instead of hardcoding `ui-avatars.com` URLs. `next.config.ts` only whitelists `picsum.photos`, `randomuser.me`, `ui-avatars.com` for `<Image>`.

## Housekeeping

Root-level `refine_*.js` and `replace_dashboard.js` are one-off migration scripts from past UI refactors; don't rely on them and don't add more. `create_accounts.ts` is a dev helper for creating extra seed users. `metadata.json` is an AI Studio applet manifest, unrelated to Next metadata.

## Branching

All development on this session goes to branch `claude/add-claude-documentation-mO3h8`. Do not push to `main` directly.

## Repair-cycle lessons

### Source of truth
- `prisma/schema.prisma` defines data shape. `lib/auth.ts` is the only auth source. Public provider API shape lives in `SINGLE_SELECT` in `app/api/providers/route.ts` — widen that `select` when the UI needs a new field.
- Customer-facing pages (notably `app/providers/[id]/page.tsx`) render **duplicated tile rows**: a `hidden sm:grid` desktop row and a `sm:hidden grid-cols-3` mobile row. Update both when changing a tile.
- Save path: settings form → `PATCH /api/provider/profile` → Prisma. Read path: page → `GET /api/providers` → Prisma. Don't cross the wires.

### Deployment & migration
- `next.config.ts` suppresses TS + ESLint errors in build; a passing build is not a correctness signal. Run `npm run lint` and `npx tsc --noEmit` locally before pushing.
- `npm run build` runs `prisma migrate deploy`. New columns require a migration **and** a `.catch` that inspects for `P2022` / column name in every read site (see `app/api/chat/route.ts`, `app/api/bookings/route.ts`). Don't drop the fallback.
- `DATABASE_URL` = pooled (6543, `?pgbouncer=true`). `DIRECT_URL` = 5432 for migrations. Never swap them.

### Debugging workflow
- Trace data end-to-end **before editing**: DB column → Prisma `select` → API response → page render. Confirm which layer actually drops the data.
- For any field visible on a page, `grep -n "\.fieldName\b"` across `app/**/*.{ts,tsx}` to find every render site — never fix just the one you noticed.
- Reproduce at both `≥ sm` (≥640px) and `< sm` widths for any visual bug; breakpoint-duplicated markup bites.
- Edit only the layer that's wrong. No "while I'm here" refactors on unrelated layers.

### Known bug patterns
- **Breakpoint duplication:** desktop and mobile tile markup diverge — e.g. `languages.join(', ')` on desktop vs. `languages[0]` on mobile.
- **Array-indexed render:** `arr[0]` used where `.join(', ')` was intended, collapsing multi-value fields to one.
- **Empty-state blanks:** `[].join(', ')` renders as empty string; always guard with `arr?.length ? arr.join(', ') : '—'`.
- **Auth `id` cast:** `(session.user as any).id` is load-bearing; the session callback also falls back from id→email. Don't "clean up" either.
- **Stripe lazy Proxy:** `lib/stripe.ts` must stay lazy so `next build` works without `STRIPE_SECRET_KEY`.
- **Migration drift:** newest migrations (`20260403*`, `20260404*`, `20260412*`, `20260417*`, `20260420*`) are guarded by `.catch` fallbacks. Extend the pattern, don't remove it.
- **PII redaction:** all outgoing chat content passes through `redactPII` — never bypass it for user content.

### Branching & promotion
- Keep repair work on the current feature branch until explicitly merged; do not push directly to `main`.
- One commit per logical fix with a `why`-first message; push with `git push -u origin <branch>`.
- Don't open a PR unless the user asks.
- After each push report: exact file changed, exact root cause, exact rendering/behaviour change, exact manual verification steps, commit hash.
