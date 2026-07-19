# Security

Phase 1 security principles:

- Do not trust client-side permission hiding.
- Store session tokens hashed in the database.
- Use HTTP-only SameSite cookies.
- Store passwords as salted scrypt hashes.
- Validate inputs with Zod.
- Keep Founder-only notes and approved financial values out of Operations payloads.
- Never log passwords, tokens, API keys, or secrets.
- Use audit logs for login/logout, access grants, approvals, reports, publications, and significant record changes.

Authentication decision:

Better Auth remains part of the target production stack, but Slice 2 preserves the custom Prisma-backed session implementation because it is aligned to the current schema and avoids running two competing auth paths during Alex trial readiness.

Remaining hardening:

- Optionally migrate to Better Auth only if it cleanly replaces the current session path.
- Add email verification delivery.
- Add production rate limiting backed by durable storage.
- Add full file upload scanning and storage adapter controls.
