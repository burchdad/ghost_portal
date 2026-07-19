# Architecture

Ghost Portal uses Next.js App Router route groups:

- `(auth)` for login and password recovery routes.
- `(portal)` for authenticated operational routes.

The portal layout owns the sidebar, header, role badge, notifications affordance, and Nova drawer. Data reads happen in React Server Components through Prisma. Mutations live in server actions or server workflow modules.

The app keeps business rules in server modules rather than client components.

Phase 1 uses one authentication path: a custom Prisma-backed session implementation. Passwords are salted scrypt hashes, sessions are stored as hashed tokens, and cookies are HTTP-only with SameSite protection.
