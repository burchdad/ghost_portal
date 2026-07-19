# Ghost Portal

Ghost Portal is the internal operations portal for Ghost AI Solutions.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- TailwindCSS 4
- shadcn-style primitives
- Prisma + PostgreSQL
- Better Auth-ready server boundary
- React Query
- Zod
- React Hook Form
- Framer Motion
- Lucide Icons

## Getting Started

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

## Project Shape

- `src/app` contains App Router pages and API route handlers.
- `src/components/portal` contains the operations portal shell and feature surfaces.
- `src/server/permissions` owns role and permission checks.
- `src/server/data` contains typed seed/demo data used before live queries are connected.
- `prisma/schema.prisma` defines the normalized production database model.

## First Seed Users

- Stephen Burch, Founder
- Alexandra Canto, Operations

Permissions are enforced through server-side helpers. Client UI gating is only a presentation layer.
