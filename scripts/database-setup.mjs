import { spawnSync } from "node:child_process";

if (process.env.SKIP_DATABASE_SETUP === "1") {
  console.log("Skipping database setup because SKIP_DATABASE_SETUP=1.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.log("Skipping database setup because DATABASE_URL is not set.");
  process.exit(0);
}

// The first Academy migration deployment failed before any SQL was applied because
// the migration file had a UTF-8 BOM. Mark only that failed attempt as rolled back
// when present, then let `migrate deploy` apply the corrected migration normally.
spawnSync("pnpm", ["exec", "prisma", "migrate", "resolve", "--rolled-back", "20260720015000_ghost_academy_phase1"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

for (const args of [
  ["prisma", "migrate", "deploy"],
  ["prisma", "db", "seed"]
]) {
  const result = spawnSync("pnpm", ["exec", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
