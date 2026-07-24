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
const academyMigration = "20260720015000_ghost_academy_phase1";
const migrationStatus = spawnSync("pnpm", ["exec", "prisma", "migrate", "status"], {
  encoding: "utf8",
  shell: process.platform === "win32"
});
const migrationStatusOutput = `${migrationStatus.stdout ?? ""}\n${migrationStatus.stderr ?? ""}`;

if (migrationStatusOutput.includes(academyMigration) && /failed/i.test(migrationStatusOutput)) {
  spawnSync("pnpm", ["exec", "prisma", "migrate", "resolve", "--rolled-back", academyMigration], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
}

const commands = [["prisma", "migrate", "deploy"]];

if (process.env.RUN_DATABASE_SEED === "1") {
  commands.push(["prisma", "db", "seed"]);
} else {
  console.log("Skipping database seed because RUN_DATABASE_SEED is not set to 1.");
}

for (const args of commands) {
  const result = spawnSync("pnpm", ["exec", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
