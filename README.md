# Ghost Portal

Ghost Portal is the internal operations portal for Ghost AI Solutions. Phase 1 focuses on securely onboarding Alexandra Marie Canto for a one-week Operations and Executive Assistant trial while preserving Stephen Burch's Founder-level control.

## Architecture

- Next.js 15 App Router with protected route groups.
- React 19 and TypeScript.
- Prisma ORM with PostgreSQL.
- Prisma-backed password/session authentication with HTTP-only cookies.
- Role permissions plus record-level client, lead, and file access.
- Dark premium Ghost Portal layout with sidebar, header, and Nova drawer.

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm academy:seed
pnpm dev
```

## Environment

Set placeholders in `.env`; never commit real secrets.

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `FOUNDER_SEED_EMAIL`
- `FOUNDER_SEED_PASSWORD`
- `OPERATIONS_SEED_EMAIL`
- `OPERATIONS_SEED_PASSWORD`
- `UPLOADTHING_TOKEN`
- `OPENAI_API_KEY`

Seed passwords are read only from environment variables. If `OPERATIONS_SEED_PASSWORD` is unset, Alex is seeded as `Invited`.

## Seed Users

- Stephen Burch: Founder, `America/Chicago`
- Alexandra Marie Canto: Operations, `Asia/Manila`, initial email `amariexc@gmail.com`

## Permission Model

Founder can access all Phase 1 records and admin routes. Operations users can access onboarding, assigned tasks, assigned clients, assigned leads, daily reports, approvals they request, published knowledge, announcements, feedback, and authorized files.

Record-level authorization is separate from role authorization. Alex does not see all clients or leads by role alone; she needs `ClientAccess` or `LeadAccess`.

## Verification

```bash
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

Use Vercel for the Next.js application and Railway PostgreSQL for `DATABASE_URL`. Run Prisma migrations during deployment, then seed only with explicit environment credentials. Point `portal.ghostai.solutions` at the Vercel production deployment.

Ghost Academy content is seeded by `pnpm db:seed` or `pnpm academy:seed`. Academy records use stable `sourceKey` values and update only seed-managed content. Founder-edited Academy modules are marked manually managed and are not blindly overwritten by later seed runs.

## Phase 1 Scope

Implemented Phase 1 workflow coverage includes protected route architecture, authentication/session helpers, record access helpers, expanded Prisma models, seed data, dashboard data queries, task creation and updates, client/lead access management, draft communication approval, onboarding completion, daily reports, approval decisions, notifications, feedback, audit utility, and security tests.

Known remaining work: optional Better Auth migration if it cleanly maps to the current schema, email verification delivery, password reset email delivery, production upload adapter, richer reusable table controls, and full Playwright browser verification.
