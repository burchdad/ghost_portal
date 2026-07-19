import { spawnSync } from "node:child_process";

if (process.env.SKIP_DATABASE_SETUP === "1") {
  console.log("Skipping database setup because SKIP_DATABASE_SETUP=1.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.log("Skipping database setup because DATABASE_URL is not set.");
  process.exit(0);
}

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
