# Deployment

Target hosting:

- Vercel for the Next.js app.
- Railway PostgreSQL for the database.
- `portal.ghostai.solutions` as the production domain.

Deployment checklist:

1. Set production environment variables in Vercel.
2. Set `DATABASE_URL` to the Railway PostgreSQL connection string.
3. Run Prisma migrations.
4. Seed only with explicit Founder and Operations seed credentials.
5. Rotate seed passwords after first login or move to invitation flow.
6. Configure backups in Railway.
