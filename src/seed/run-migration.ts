/**
 * IronTrack Daily — Migration Runner
 * This creates all required tables in Supabase.
 * 
 * Prerequisites:
 * 1. Go to Supabase Dashboard → Settings → Database
 * 2. Copy the "Connection string" (URI format)
 * 3. Run: DATABASE_URL="postgres://..." npx tsx src/seed/run-migration.ts
 * 
 * OR just paste the SQL from src/migrations/001_irontrack_daily.sql
 * into the Supabase SQL Editor at:
 * https://supabase.com/dashboard/project/raxdqjivrathfornpxug/editor
 */
import { readFileSync } from "fs";
import path from "path";
import { Client } from "pg";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set.");
    console.log("\n📋 Instructions:");
    console.log("1. Go to: https://supabase.com/dashboard/project/raxdqjivrathfornpxug/settings/database");
    console.log("2. Copy the 'URI' connection string (use 'Session mode' for pg migrations)");
    console.log("3. Run: DATABASE_URL=\"postgres://...\" npx tsx src/seed/run-migration.ts");
    console.log("\nOR copy the SQL from src/migrations/001_irontrack_daily.sql");
    console.log("and paste it in: https://supabase.com/dashboard/project/raxdqjivrathfornpxug/editor");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const sqlFile = path.join(process.cwd(), "src", "migrations", "001_irontrack_daily.sql");
  const sql = readFileSync(sqlFile, "utf-8");

  console.log("🔌 Connecting to Supabase...");
  await client.connect();
  console.log("✅ Connected");

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let success = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt + ";");
      success++;
    } catch (e: unknown) {
      const err = e as { message: string };
      if (err.message?.includes("already exists")) {
        console.log("⚠️  Already exists:", stmt.slice(0, 60) + "...");
      } else {
        console.error("❌ Error:", err.message, "\nStatement:", stmt.slice(0, 100));
      }
    }
  }

  await client.end();
  console.log(`\n✅ Migration complete. ${success} statements executed.`);
  console.log("🌱 Now run: npx tsx src/seed/seed-demo.ts");
}

main().catch(console.error);
