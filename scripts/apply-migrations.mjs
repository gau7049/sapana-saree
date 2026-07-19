import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const withSeed = process.argv.includes("--seed");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice("--only=".length) : null;

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("SUPABASE_DB_URL is not set. Add it to .env.local and re-run with:");
    console.error("  node --env-file=.env.local scripts/apply-migrations.mjs");
    process.exit(1);
  }

  const migrationsDir = path.join(root, "supabase", "migrations");
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .filter((f) => !only || f.includes(only))
    .sort();

  if (files.length === 0) {
    console.error(`No .sql files found in ${migrationsDir}`);
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const file of files) {
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      console.log(`Applying ${file}...`);
      await client.query(sql);
      console.log(`  done`);
    }

    if (withSeed) {
      const seedPath = path.join(root, "supabase", "seed.sql");
      const sql = await readFile(seedPath, "utf8").catch(() => null);
      if (sql) {
        console.log("Applying seed.sql...");
        await client.query(sql);
        console.log("  done");
      } else {
        console.warn(`--seed passed but ${seedPath} not found, skipping.`);
      }
    }

    console.log("All migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
